// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';
import * as d3Selection from 'd3-selection';
import PureRenderComponent from '../../pure-render-component';
import {
  getAttributeFunctor,
  getAttr0Functor,
  getAttributeValue,
  getScaleObjectFromProps,
  getScalePropTypesByAttribute
} from '../../utils/scales-utils';
import {AnimationPropType} from '../../utils/animation-utils';

const propTypes = {
  ...getScalePropTypesByAttribute('x'),
  ...getScalePropTypesByAttribute('y'),
  ...getScalePropTypesByAttribute('size'),
  ...getScalePropTypesByAttribute('opacity'),
  ...getScalePropTypesByAttribute('color'),
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  data: React.PropTypes.array,
  onValueMouseOver: React.PropTypes.func,
  onValueMouseOut: React.PropTypes.func,
  onValueClick: React.PropTypes.func,
  onSeriesMouseOver: React.PropTypes.func,
  onSeriesMouseOut: React.PropTypes.func,
  onSeriesClick: React.PropTypes.func,
  onNearestX: React.PropTypes.func,
  animation: AnimationPropType
};

class AbstractSeries extends PureRenderComponent {

  constructor(props) {
    super(props);

    /**
     * Mouse over handler for the series without single values.
     * @type {function}
     * @protected
     */
    this._mouseOver = this._mouseOverHandler.bind(this, false);

    /**
     * Mouse over handler for the series **with** single values.
     * @type {function}
     * @protected
     */
    this._mouseOverWithValue = this._mouseOverHandler.bind(this, true);

    /**
     * Mouse out handler for the series without single values.
     * @type {function}
     * @protected
     */
    this._mouseOut = this._mouseOutHandler.bind(this, false);

    /**
     * Mouse out handler for the series **with** single values.
     * @type {function}
     * @protected
     */
    this._mouseOutWithValue = this._mouseOutHandler.bind(this, true);

    /**
     * Click handler for the series without single values.
     * @type {function}
     * @protected
     */
    this._click = this._clickHandler.bind(this, false);

    /**
     * Click handler for the series **with** single values.
     * @type {function}
     * @protected
     */
    this._clickWithValue = this._clickHandler.bind(this, true);
  }

  /**
   * Mouse over handler for all series.
   * @param {boolean} useValue Use value handler if true.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @private
   */
  _mouseOverHandler(useValue, d, event) {
    const {onValueMouseOver, onSeriesMouseOver} = this.props;
    if (useValue && onValueMouseOver) {
      onValueMouseOver(d, {event});
    }
    if (onSeriesMouseOver) {
      onSeriesMouseOver({event});
    }
  }

  /**
   * Mouse out handler for all series.
   * @param {boolean} useValue Use value handler if true.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @private
   */
  _mouseOutHandler(useValue, d, event) {
    const {onValueMouseOut, onSeriesMouseOut} = this.props;
    if (useValue && onValueMouseOut) {
      onValueMouseOut(d, {event});
    }
    if (onSeriesMouseOut) {
      onSeriesMouseOut({event});
    }
  }

  /**
   * Click handler for all series.
   * @param {boolean} useValue Use value handler if true.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @private
   */
  _clickHandler(useValue, d, event) {
    const {onValueClick, onSeriesClick} = this.props;
    if (useValue && onValueClick) {
      onValueClick(d, {event});
    }
    if (onSeriesClick) {
      onSeriesClick({event});
    }
  }

  /**
   * Tells the rest of the world that it requires SVG to work.
   * @returns {boolean} Result.
   */
  static get requiresSVG() {
    return true;
  }

  /**
   * Get a default config for the parent.
   * @returns {Object} Empty config.
   */
  static getParentConfig() {
    return {};
  }

  /**
   * Get attribute functor.
   * @param {string} attr Attribute name
   * @returns {*} Functor.
   * @protected
   */
  _getAttributeFunctor(attr) {
    return getAttributeFunctor(this.props, attr);
  }

  /**
   * Get the attr0 functor.
   * @param {string} attr Attribute name.
   * @returns {*} Functor.
   * @private
   */
  _getAttr0Functor(attr) {
    return getAttr0Functor(this.props, attr);
  }

  /**
   * Get the attribute value if it is available.
   * @param {string} attr Attribute name.
   * @returns {*} Attribute value if available, fallback value or undefined
   * otherwise.
   * @protected
   */
  _getAttributeValue(attr) {
    return getAttributeValue(this.props, attr);
  }

  /**
   * Get the scale object distance by the attribute from the list of properties.
   * @param {string} attr Attribute name.
   * @returns {number} Scale distance.
   * @protected
   */
  _getScaleDistance(attr) {
    const scaleObject = getScaleObjectFromProps(this.props, attr);
    return scaleObject ? scaleObject.distance : 0;
  }

  onParentMouseMove(event) {
    const {marginLeft = 0, onNearestX, data} = this.props;
    if (!onNearestX || !data) {
      return;
    }
    let minDistance = Number.POSITIVE_INFINITY;
    let value = null;

    // TODO(antonb): WAT?
    d3Selection.event = event.nativeEvent;
    const coordinate = d3Selection.mouse(event.currentTarget)[0] - marginLeft;
    const xScaleFn = this._getAttributeFunctor('x');

    data.forEach(item => {
      const currentCoordinate = xScaleFn(item);
      const newDistance = Math.abs(coordinate - currentCoordinate);
      if (newDistance < minDistance) {
        minDistance = newDistance;
        value = item;
      }
    });
    if (!value) {
      return;
    }
    onNearestX(value, {
      innerX: xScaleFn(value),
      event: event.nativeEvent
    });
  }
}

AbstractSeries.displayName = 'AbstractSeries';
AbstractSeries.propTypes = propTypes;

export default AbstractSeries;
