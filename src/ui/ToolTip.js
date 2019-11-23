import * as maptalks from 'maptalks';
import BaseObject from './../BaseObject';

class ToolTip extends maptalks.ui.ToolTip {

    /**
    * Adds the UI Component to a BaseObject
    * @param {BaseObject} owner - BaseObject to add.
    * @returns {UIComponent} this
    * @fires UIComponent#add
    */
    addTo(owner) {
        if (owner instanceof BaseObject) {
            owner.on('mousemove', this.onMouseMove, this);
            owner.on('mouseout', this.onMouseOut, this);
            this._owner = owner;
            // first time
            this._switchEvents('on');
            if (this.onAdd) {
                this.onAdd();
            }
            /**
             * add event.
             *
             * @event ui.UIComponent#add
             * @type {Object}
             * @property {String} type - add
             * @property {ui.UIComponent} target - UIComponent
             */
            this.fire('add');
            return this;
        } else {
            throw new Error('Invalid BaseObject the tooltip is added to.');
        }
    }
}

export default ToolTip;
