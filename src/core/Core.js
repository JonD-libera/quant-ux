import lang from 'dojo/_base/lang'
import Logger from 'common/Logger'
import Evented from 'dojo/Evented'
import ModelGeom from 'core/ModelGeom'
import ModelResizer from 'core/ModelResizer'

export default class Core extends Evented{

    constructor () {
        super()
        this.logger = new Logger("Core");
    }

    getContainedChildWidgets (container, model) {
        let result = []
        /*
         * Loop over sorted list
         */
        let sortedWidgets = this.getOrderedWidgets(model.widgets)
        let found = false
        for (let i = 0; i < sortedWidgets.length; i++){
            let widget = sortedWidgets[i]
             if (container.id != widget.id) {
                if (found && this._isContainedInBox(widget, container)){
                    widget.container = container.id
                    result.push(widget)
                }
            } else {
                found = true
            }
        }
        return result;
    }

     /**
     * Gets all teh widgets that are in the container! The method
     * takes the order into account
     * @param {} widgets 
     * @param {*} container 
     */
    getParentWidgets (widget, model) {
        let result = []
        /*
         * Loop over sorted list
         */
        let sortedWidgets = this.getOrderedWidgets(model.widgets)
        for (let i = 0; i < sortedWidgets.length; i++){
            let container = sortedWidgets[i]
            //console.debug('Repeater.core', container.name, container.isContainer, container.id, widget.id)
            /**
             * if the widget is the potential container, we can stop,
             * because everz thing after is above.
             */
            if (container.id != widget.id) {
                if (container.isContainer) {
                    //console.debug('  Repeater.core', widget.x, container.x)
                    if (this._isContainedInBox(widget, container)){
                        result.push(container)
                    }
                }
            } else {
                //console.debug('Repeater.core.exit')
                break;
            }
        }
        return result;
    }

    getObjectLength (o) {
        if (o) {
            return Object.keys(o).length;
        } else {
            return 0;
        }
    }

     /**********************************************************************
     * Clone Tool
     **********************************************************************/
    getClones (ids, target) {
        console.debug('getClones enter')
        var result = [];
        var previews = [];
  
        // 1) get bounding box
        var boudingBox = this.getBoundingBox(ids);
  
        var xFactor = 1;
        if (boudingBox.x > target.x) {
          xFactor = -1;
        }
  
        var yFactor = 1;
        if (boudingBox.y > target.y) {
          yFactor = -1;
        }
  
        var xCount = Math.floor(target.w / boudingBox.w);
        var yCount = Math.floor(target.h / boudingBox.h);
        var xSpace = Math.round((target.w - xCount * boudingBox.w) / Math.max(1, xCount - 1));
        var ySpace = Math.round((target.h - yCount * boudingBox.h) / Math.max(1, yCount - 1));
        //console.debug("getClones > x: ", xCount,xSpace, " y:", yCount, ySpace, " >> bb: ", boudingBox.w, boudingBox.h, boudingBox.y)
  
        var offSets = {};
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          var box = this.getBoxById(id);
          offSets[id] = {
            x: box.x - boudingBox.x,
            y: box.y - boudingBox.y,
            box: box
          };
        }
  
        // now create grid but not at 0,0
        var count = 0;
        for (let x = 0; x < xCount; x++) {
          for (let y = 0; y < yCount; y++) {
            if (x != 0 || y != 0) {
              let id;
              for (let i = 0; i < ids.length; i++) {
                id = ids[i];
                var offset = offSets[id];
                //console.debug(id,offset.x, offset.y , offset.box.h + ySpace + offset.y)
                var clone = {
                  w: boudingBox.w,
                  h: boudingBox.h,
                  x: boudingBox.x + (x * (boudingBox.w + xSpace) + offset.x) * xFactor,
                  y: boudingBox.y + (y * (boudingBox.h + ySpace) + offset.y) * yFactor,
                  z: offset.box.z,
                  group: count,
                  cloneOff: id
                };
                result.push(clone);
              }
              /**
               * FIXME: Should this be in the loop?
               */
              var preview = {
                w: boudingBox.w,
                h: boudingBox.h,
                x: boudingBox.x + x * (boudingBox.w + xSpace) * xFactor,
                y: boudingBox.y + y * (boudingBox.h + ySpace) * yFactor,
                z: 0,
                cloneOff: id
              };
              previews.push(preview);
              count++;
            }
          }
        }
        return {
          previews: previews,
          clones: result
        };
    }
  
     /***************************************************************************
     * UI Geometrix helpers
     ***************************************************************************/

    getBoundingBox (ids) {
        return ModelGeom.getBoundingBox(ids, this.model);
    }
  
    getBoundingBoxByBoxes (boxes) {
        return ModelGeom.getBoundingBoxByBoxes(boxes);
    }

    getBoxById (id) {
        return ModelGeom.getBoxById(id, this.model)
    }

    getParentScreen (widget, model) {
        if (!model) {
            model = this.model
        }
        for (var id in model.screens) {
            var screen = model.screens[id];
            var i = screen.children.indexOf(widget.id);
            if (i > -1) {
            return screen;
            }
        }
        return null;
    }

    getWidgetPostionInScreen (widget, model) {
        var screen = this.getParentScreen(widget, model);
        if (screen) {
            return {
            x: widget.x - screen.x,
            y: widget.y - screen.y,
            w: widget.w,
            h: widget.h
            };
        } else {
            return {
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h
            };
        }
    }

    _correctBoundindBox (boundingbox, modelBoundingBox) {
        if (Math.abs(boundingbox.x - modelBoundingBox.x) <= 2) {
            this.logger.log(2, "_correctBoundindBox", "Correct X");
            boundingbox.x = modelBoundingBox.x;
        }

        if (Math.abs(boundingbox.y - modelBoundingBox.y) <= 2) {
            this.logger.log(2, "_correctBoundindBox", "Correct Y");
            boundingbox.y = modelBoundingBox.y;
        }
        return boundingbox;
    }

    /**
     * Gets the new position for a group child
     */
    _getGroupChildResizePosition (widget, oldGroup, newGroup, dif) {
        return ModelResizer.getGroupChildResizePosition(widget, oldGroup, newGroup, dif)
    }
  
    getObjectFromArray (list, key) {
        var result = {};
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var value = item[key];
            result[value] = item;
        }
        return result;
    }
  
    getArrayFromObject (obj, key) {
        var result = [];
        for (var i in obj) {
            var item = obj[i];
            if (key) {
            item[key] = i;
            }
            result.push(item);
        }
        return result;
    }
  
    getWidgetsByDistanceAndType (widget, types) {
        var result = [];

        if (this.model) {
            let screen = this.getParentScreen(widget);
            let children = screen.children;

            for (let i = 0; i < children.length; i++) {
            let widgetID = children[i];

            if (widgetID != widget.id) {
                let childWidget = this.model.widgets[widgetID];
                var type = childWidget.type;
                if (types.indexOf(type) >= 0) {
                result.push({
                    d: 0,
                    y: childWidget.y,
                    w: childWidget
                });
                }
            }
            }
            result.sort(function(a, b) {
            return a.y - b.y;
            });
        }

        return result;
    }


    /**********************************************************************
     * Distribute Tool
     **********************************************************************/
    _distributedPositions (type, ids, boundingBox) {
        /**
         * 1) get all subsets (rows or columns) depending on type
         */
        var sets = [];
        for (let i = 0; i < ids.length; i++) {
            var widgetID = ids[i];
            var widget = this.model.widgets[widgetID];
            if (widget) {
                /**
                 * Attention: This seems counter intuitive. But for vertical,
                 * we have to find columns (x axis) and for horizontal we need
                 * rows (z - axis).
                 */
                if (type == "vertical") {
                    let start = widget.x;
                    let end = widget.x + widget.w;
                    this._addToDisSet(sets, widget, start, end);
                } else {
                    let start = widget.y;
                    let end = widget.y + widget.h;
                    this._addToDisSet(sets, widget, start, end);
                }
            }
        }

        /**
         * Now resize for every set!
         */
        var result = {};
        var distances = [];
        for (let i = 0; i < sets.length; i++) {
            var set = sets[i];
            var temp = this._distributedPositionsInSubSet(
            type,
            set.children,
            boundingBox
            );
            var tempPositions = temp.positions;
            for (var id in tempPositions) {
            if (!result[id]) {
                result[id] = tempPositions[id];
            } else {
                if (this.logger) {
                this.logger.error(
                    "_distributedPositions()",
                    "Widget with id is in two sets: " + id
                );
                this.logger.sendError(
                    new Error("_distributedPositions() > Sets not ok")
                );
                }
            }
            }
            distances = distances.concat(temp.distances);
        }

        return {
            positions: result,
            distances: distances
        };
    }
  
    _addToDisSet (sets, widget, start, end) {
        var overlapps = [];
  
        for (let i = 0; i < sets.length; i++) {
          var set = sets[i];
          var overlap = this._getDisOverlap(start, end, set.start, set.end);
          if (overlap > 0) {     
            set.start = Math.min(set.start, start);
            set.end = Math.max(set.end, end);
            set.children.push(widget.id);
            set.pos = i;
            overlapps.push(set);
          }
        }
        if (overlapps.length == 0) {
          sets.push({
            start: start,
            end: end,
            children: [widget.id]
          });
        }
  
        /**
         * If an element is in two sets, the sets should be merged!
         * This is not super important, as we would have in worst
         * case one set, which would fuck up rending in worst case...
         * Actually this should not happen often (or at all)
         */
        if (overlapps.length > 1) {
          if (this.logger) {
            this.logger.warn("_addToDisSet()", "Merging of sets needed");
          }
          var merged = {
            start: start,
            end: end,
            children: []
          };
          for (let i = 0; i < overlapps.length; i++) {
            let temp = overlapps[i];
            merged.start = Math.min(merged.start, temp.start);
            merged.end = Math.max(merged.end, temp.end);
            merged.children = merged.children.concat(temp.children);
            sets.splice(temp.pos, 1);
          }
        }
      }
  
    _getDisOverlap (a, b, c, d) {
        //return Math.max(0, Math.min(max1, max2) - Math.max(min1, min2))
        return (
          Math.min(Math.max(a, b), Math.max(c, d)) -
          Math.max(Math.min(c, d), Math.min(a, b))
        );
    }
  
    _distributedPositionsInSubSet (type, ids, boundingBox) {
        var result = {};

        /**
         * 1) find groups... This can be bounding boxes or single widgets
         */
        var boxes = this._getSelectionGroupPositions(ids);

        /**
         * 2) Now we calculate the positions
         */
        var positions = this._getDistributedPositions(type, boxes, boundingBox);
        var distances = [];
        /**
         * 3) now we fit the group children to their parents...
         */
        for (var id in positions) {
            var newPos = positions[id];
            if (newPos.children) {
            for (var widgetID in newPos.children) {
                var widgetPos = newPos.children[widgetID];
                widgetPos.x = newPos.x + widgetPos.offSetX;
                widgetPos.y = newPos.y + widgetPos.offSetY;
                result[widgetID] = widgetPos;
            }
            } else {
            result[id] = newPos;
            }

            if (newPos.distanceX || newPos.distanceY) {
            distances.push({
                x: newPos.distanceX,
                y: newPos.distanceY
            });
            }
        }

        return {
            positions: result,
            distances: distances
        };
    }

    _getDistributedPositions (type, boxes, boundingBox) {
        var positions = {};

        boxes.sort(function(a, b) {
            if (type == "vertical") {
            return a.y - b.y;
            } else {
            return a.x - b.x;
            }
        });
        var sum = 0;
        for (let i = 0; i < boxes.length; i++) {
            var box = boxes[i];
            if (type == "vertical") {
            sum += box.h;
            } else {
            sum += box.w;
            }
        }
        var last = boxes[boxes.length - 1];
        if (type == "vertical") {
            sum = boundingBox.h - sum;
        } else {
            sum = boundingBox.w - sum;
        }

        var space = sum / (boxes.length - 1);
        last = 0;
        var lastBox = null;
        for (let i = 0; i < boxes.length; i++) {
            let widget = boxes[i];

            let widgetPos = {
            x: widget.x,
            y: widget.y,
            h: widget.h,
            w: widget.w,
            children: widget.children
            };
            if (i == 0) {
            if (type == "vertical") {
                widgetPos.y = boundingBox.y;
                last = widgetPos.y + widgetPos.h;
            } else {
                widgetPos.x = boundingBox.x;
                last = widgetPos.x + widgetPos.w;
            }
            } else if (i == boxes.length - 1) {
            if (type == "vertical") {
                widgetPos.y = Math.round(boundingBox.y + boundingBox.h - widget.h);
            } else {
                widgetPos.x = Math.round(boundingBox.x + boundingBox.w - widget.w);
            }
            } else {
            if (type == "vertical") {
                widgetPos.y = Math.round(last + space);
                last = Math.round(widgetPos.y + widgetPos.h);
            } else {
                widgetPos.x = Math.round(last + space);
                last = Math.round(widgetPos.x + widgetPos.w);
            }
            }

            /**
             * Also store distance so we can show later!
             */
            if (lastBox) {
            if (type == "vertical") {
                widgetPos.distanceY = {
                y: lastBox.y + lastBox.h,
                h: widgetPos.y - (lastBox.y + lastBox.h),
                x: Math.round(widgetPos.x + widgetPos.w / 2)
                };
            } else {
                //console.debug("distHor", widgetPos.x - (lastBox.x +lastBox.w))
                widgetPos.distanceX = {
                x: lastBox.x + lastBox.w,
                w: widgetPos.x - (lastBox.x + lastBox.w),
                y: Math.round(widgetPos.y + widgetPos.h / 2)
                };
            }
            }

            positions[widget.id] = widgetPos;
            lastBox = widgetPos;
        }
        return positions;
    }


      /**
     * Get widget positions and bounding boxes for groups...
     */
    _getSelectionGroupPositions (ids) {
        var groups = {};
        for (var i = 0; i < ids.length; i++) {
            var widgetID = ids[i];
            var widget = this.model.widgets[widgetID];
            var group = this.getParentGroup(widgetID);
            if (group) {
            if (!groups[group.id]) {
                var bbx = this.getBoundingBox(group.children);
                bbx.children = {};
                groups[group.id] = bbx;
            }
            groups[group.id].children[widgetID] = {
                x: widget.x,
                y: widget.y,
                h: widget.h,
                w: widget.w,
                offSetX: widget.x - bbx.x,
                offSetY: widget.y - bbx.y
            };
            } else {
            groups[widgetID] = {
                x: widget.x,
                y: widget.y,
                h: widget.h,
                w: widget.w
            };
            }
        }
        return this.getArrayFromObject(groups, "id");
    }
  
  
    /**********************************************************************
     * Bounding Box
     **********************************************************************/
  
    getGroupBoundingBox (ids) {
        var result = { x: 100000000, y: 100000000, w: 0, h: 0 };

        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            var box = this.model.widgets[id];
            if (box) {
            result.x = Math.min(result.x, box.x);
            result.y = Math.min(result.y, box.y);
            result.w = Math.max(result.w, box.x + box.w);
            result.h = Math.max(result.h, box.y + box.h);
            } else {
            console.warn("getGroupBoundingBox() > No box with id", id);
            }
        }

        result.h -= result.y;
        result.w -= result.x;

        return result;
    }

    getScreenAnimation (screen, eventType) {
        if (screen.animation && screen.animation[eventType]) {
            return screen.animation[eventType];
        }
    }

    getDataBinding (widget) {
        if (widget && widget.props && widget.props.databinding) {
            return widget.props.databinding;
        }
    }

    getChanges (objOld, objNew, parentPath) {
    
        var changes = [];

        /**
         * check which things have changed in the new model
         */
        for (let key in objOld) {
            let vOld = objOld[key];
            let vNew = objNew[key];

            let change = this.getChange(key, vOld, vNew);
            if (change) {
            change.parent = parentPath;
            changes.push(change);
            }
        }

        /**
         * check which things were added
         */
        for (let key in objNew) {
            let vOld = objOld[key];
            let vNew = objNew[key];

            if (vOld === undefined || vOld === null) {
            let change = {
                name: key,
                type: "add",
                object: vNew,
                parent: parentPath
            };
            changes.push(change);
            }
        }
        return changes;
    }

    getChange (key, vOld, vNew) {
        if (vNew === undefined || vNew === null) {
            return {
            name: key,
            type: "delete",
            oldValue: vOld
            };
        } else if (typeof vOld !== typeof vNew) {
            return {
            name: key,
            type: "update",
            object: vNew,
            oldValue: vOld
            };
        } else if (vOld instanceof Object && vNew instanceof Object) {
            if (!this.objectEquals(vOld, vNew)) {
            return {
                name: key,
                type: "update",
                object: vNew,
                oldValue: vOld
            };
            }
        } else if (vNew !== vOld) {
            return {
            name: key,
            type: "update",
            object: vNew,
            oldValue: vOld
            };
        }
    }

    countProps (obj) {
        // FIXME: Porto to ES6
        var count = 0;
        for (let k in obj) {
            if (obj.hasOwnProperty(k)) {
            count++;
            }
        }
        return count;
    }
  
    objectEquals (v1, v2) {
        if (typeof v1 !== typeof v2) {
          return false;
        }
  
        if (typeof v1 === "function") {
          return v1.toString() === v2.toString();
        }
  
        if (v1 instanceof Object && v2 instanceof Object) {
          if (this.countProps(v1) !== this.countProps(v2)) {
            return false;
          }
          var r = true;
          for (let k in v1) {
            r = this.objectEquals(v1[k], v2[k]);
            if (!r) {
              return false;
            }
          }
          return true;
        } else {
          if (v1 === v2) {
            return true;
          } else {
            return false;
          }
        }
    }


    getStyle(model) {
        if (model.template) {
            if (this.model.templates) {
                var t = this.model.templates[model.template];
                if (t) {
                    /**
                     * Merge in overwriten styles
                     */
                    var merged = lang.clone(t.style)
                    if (model.style) {
                        for (var key in model.style) {
                            merged[key] = model.style[key]
                        }
                    }
                    return merged;
                } else {
                    console.warn("Layout.getStyle() > No template found for widget", model.id, " with template ", model.template);
                }
            }
        }
        return model.style;
    }


    getInheritedStyle(model, widgetViewMode) {
        if (model && model.parentWidget) {
            var parent = this.model.widgets[model.parentWidget];
            if (parent) {
                var style = lang.mixin(
                    lang.clone(parent[widgetViewMode]),
                    model[widgetViewMode]
                );
                return style;
            } else {
                console.warn("Layout.getInheritedStyle() > No template found for widget", model.id," with widgetViewMode ", widgetViewMode);
            }
        }
        return model.style;
    }

    getWidgetById(id, model) {

        if (model.widgets[id]) {
            return model.widgets[id];
        }
        /**
         * Ok, there seems to be an inherited model id???
         */
        var parts = id.split("@");
        if (parts.length == 2) {
            var widgetID = parts[0];
            return model.widgets[widgetID];
        }

        return null;
    }

    /**
     * Gets the right line for a box. In case of
     * inherited widgets it takes the line of the parent
     */
    getLineFrom (box) {
        var boxID = box.id;
        if (box.inherited) {
            boxID = box.inherited;
        }

        for (var id in this.model.lines) {
            var line = this.model.lines[id];
            if (line.from == boxID) {
                return line;
            }
        }
        return null;
    }

    /**
     * Returns all lines where line.from is == box.id.
     *
     * The lines are ordered by id, which might be wrong...
     */
    getFromLines (box) {
        var result = [];
        for (var id in this.model.lines) {
            var line = this.model.lines[id];
            if (line.from == box.id) {
                result.push(line);
            }
        }
        result.sort(function (a, b) {
            return a.id.localeCompare(b.id);
        });
        return result;
    }

    getParentGroup (widgetID) {
        if (this.model.groups) {
            for (var id in this.model.groups) {
                var group = this.model.groups[id];
                var i = group.children.indexOf(widgetID);
                if (i > -1) {
                    return group;
                }
            }
        }
        return null;
    }



    getZoomed(v, zoom) {
        return Math.round(v * zoom);
    }

    getUnZoomed(v, zoom) {
        return Math.round(v / zoom);
    }

    getZoomedBox(box, zoomX, zoomY) {
        if (box.x) {
            box.x = this.getZoomed(box.x, zoomX);
        }

        if (box.y) {
            box.y = this.getZoomed(box.y, zoomY);
        }

        if (box.w) {
            box.w = this.getZoomed(box.w, zoomX);
        }

        if (box.h) {
            box.h = this.getZoomed(box.h, zoomY);
        }

        if (box.min) {
            box.min.h = this.getZoomed(box.min.h, zoomY);
            box.min.w = this.getZoomed(box.min.w, zoomX);
        }

        box.isZoomed = true;

        return box;
    }

    getUnZoomedBox(box, zoomX, zoomY) {
        /**
         * Fall back
         */
        if (!zoomY) {
            zoomY = zoomX;
        }

        if (box.x) {
            box.x = this.getUnZoomed(box.x, zoomX);
        }

        if (box.y) {
            box.y = this.getUnZoomed(box.y, zoomY);
        }

        if (box.w) {
            box.w = this.getUnZoomed(box.w, zoomX);
        }

        if (box.h) {
            box.h = this.getUnZoomed(box.h, zoomY);
        }

        return box;
    }

     /**
     * Creates scalled down model and also adds inheritance.
     *
     * FIXME: Change name to createViewModel();
     */
    createZoomedModel (zoomX, zoomY, isPreview, model) {
        this.logger.log(3, "Core.createZoomedModel", "enter > " + zoomX + " > " + zoomY + " > " + isPreview);
  
        if (!model){
            //console.warn('createZoomedModel without model', new Error.stack)
            model = this.model;
        }
        /**
         * Fall back
         */
        if (!zoomY) {
          zoomY = zoomX;
        }
        var zoomedModel = lang.clone(model);
        zoomedModel.isZoomed = true;
  
        this.getZoomedBox(zoomedModel.screenSize, zoomX, zoomY);
  
        for (let id in zoomedModel.widgets) {
          this.getZoomedBox(zoomedModel.widgets[id], zoomX, zoomY);
        }
  
        for (let id in zoomedModel.screens) {
          var zoomedScreen = this.getZoomedBox(
            zoomedModel.screens[id],
            zoomX,
            zoomY
          );
  
          /**
           * This has a tiny tiny bug that makes copy of the same screen jump as x and y and rounded()
           * To fix this, we should take the relative and x and y in the parent and round that...
           *
           * scalledWidget.x = scalledScreen.x + (orgWidget.x - orgScreen.x)*zoomX
           *
           * As an alternative we could stop using Math.round() ...
           */
          for (let i = 0; i < zoomedScreen.children.length; i++) {
            let wid = zoomedScreen.children[i];
            let zoomWidget = zoomedModel.widgets[wid];
            let orgWidget = model.widgets[wid];
            if (orgWidget) {
              /**
               * When we copy a screen we might not have the org widget yet
               */
              var orgScreen = model.screens[zoomedScreen.id];
              var difX = this.getZoomed(orgWidget.x - orgScreen.x, zoomX);
              var difY = this.getZoomed(orgWidget.y - orgScreen.y, zoomY);
              if (orgWidget.parentWidget) {
                if (zoomWidget.x >= 0) {
                  zoomWidget.x = zoomedScreen.x + difX;
                }
                if (zoomWidget.y >= 0) {
                  zoomWidget.y = zoomedScreen.y + difY;
                }
              } else {
                zoomWidget.x = zoomedScreen.x + difX;
                zoomWidget.y = zoomedScreen.y + difY;
              }
            }
          }
        }
  
        for (let id in zoomedModel.lines) {
          let line = zoomedModel.lines[id];
          for (let i = 0; i < line.points.length; i++) {
            this.getZoomedBox(line.points[i], zoomX, zoomY);
          }
        }
  
        /**
         * Now do inheritance here
         */
        var inheritedModel = this.createInheritedModel(zoomedModel);
  
        return inheritedModel;
      }
  

    createInheritedModel(model) {
        /**
         * Build lookup map for overwrites
         */
        var overwritenWidgets = {};
        for (let screenID in model.screens) {
            let screen = model.screens[screenID];
            overwritenWidgets[screenID] = {};
            for (let i = 0; i < screen.children.length; i++) {
                let widgetID = screen.children[i];
                let widget = model.widgets[widgetID];
                if (widget && widget.parentWidget) {
                    overwritenWidgets[screenID][widget.parentWidget] = widgetID;
                }
            }
        }

     
        var inModel = lang.clone(model);
        inModel.inherited = true;

        /**
         * add container widgets
         */
        this.createContaineredModel(inModel)

        /**
         * add widgets from parent (master) screens
         */
        for (let screenID in inModel.screens) {
            /**
             * *ATTENTION* We read from the org model, otherwise we have
             * issues in the loop as we change the screen.
             */
            let inScreen = inModel.screens[screenID]
            let screen = model.screens[screenID];
            if (screen.parents && screen.parents.length > 0) {
                /**
                 * add widgets from parent screens
                 */
                for (let i = 0; i < screen.parents.length; i++) {
                    let parentID = screen.parents[i];
                    if (parentID != screenID) {
                        if (model.screens[parentID]) {
                            /**
                             * *ATTENTION* We read from the org model, otherwise we have
                             * issues in the loop as we change the screen!
                             */
                            let parentScreen = model.screens[parentID];

                            /**
                             * Also copy rulers
                             */
                            this._addRulersFromParent(inScreen, parentScreen)
                           
                            let difX = parentScreen.x - screen.x;
                            let difY = parentScreen.y - screen.y;

                            let parentChildren = parentScreen.children;
                            for (var j = 0; j < parentChildren.length; j++) {
                                let parentWidgetID = parentChildren[j];

                                /**
                                 * *ATTENTION* We read from the org model, otherwise we have
                                 * issues in the loop as we change the screen!
                                 */
                                let parentWidget = model.widgets[parentWidgetID];
                                if (parentWidget) {
                                    let overwritenWidgetID = overwritenWidgets[screenID][parentWidgetID];
                                    if (!overwritenWidgetID) {
                                        let copy = lang.clone(parentWidget);

                                        /**
                                         * Super important the ID mapping!!
                                         */
                                        copy.id = parentWidget.id + "@" + screenID;
                                        copy.inherited = parentWidget.id;
                                        copy.inheritedScreen = screenID;
                                        copy.inheritedOrder = i + 1;

                                        /**
                                         * Now lets also put it at the right position!
                                         */
                                        copy.x -= difX;
                                        copy.y -= difY;

                                        /**
                                         * We write the new widget to the inherited model!
                                         *
                                         */
                                        inModel.widgets[copy.id] = copy;
                                        inModel.screens[screenID].children.push(copy.id);

                                        /**
                                         * Also add a to the inherited copies
                                         * so we can to live updates in canvas
                                         */
                                        let parentCopy = inModel.widgets[parentWidget.id];
                                        if (!parentCopy.copies) {
                                            parentCopy.copies = [];
                                        }
                                        parentCopy.copies.push(copy.id);
                                    } else {
                                        let overwritenWidget = inModel.widgets[overwritenWidgetID];

                                        if (overwritenWidget) {
                                            //console.debug("inheried() ",overwritenWidgetID,  overwritenWidget.style.background)
                                            overwritenWidget.props = this.mixin(lang.clone(parentWidget.props),overwritenWidget.props,true);
                                            overwritenWidget.style = this.mixin(lang.clone(parentWidget.style),overwritenWidget.style,true);
                                            //console.debug("   ->", overwritenWidget.style.background, overwritenWidget.style._mixed.background)
                                            if (overwritenWidget.hover) {
                                                overwritenWidget.hover = this.mixin(lang.clone(parentWidget.hover),overwritenWidget.hover,true);
                                            }
                                            if (overwritenWidget.error) {
                                                overwritenWidget.error = this.mixin(lang.clone(parentWidget.error), overwritenWidget.error, true);
                                            }

                                            /**
                                             * Also add a reference to the *INHERITED* copies
                                             * so we can to live updates in canvas
                                             */
                                            let parentCopy = inModel.widgets[parentWidget.id];
                                            if (!parentCopy.inheritedCopies) {
                                                parentCopy.inheritedCopies = [];
                                            }
                                            parentCopy.inheritedCopies.push(overwritenWidget.id);

                                            /**
                                             * Also inherited positions
                                             */
                                            if (overwritenWidget.parentWidgetPos) {
                                                overwritenWidget.x = parentWidget.x - difX;
                                                overwritenWidget.y = parentWidget.y - difY;
                                                overwritenWidget.w = parentWidget.w;
                                                overwritenWidget.h = parentWidget.h;
                                            }
                                            overwritenWidget._inheried = true;
                                        } else {
                                            console.error("createInheritedModel() > No overwriten widget in model");
                                        }
                                    }
                                } else {
                                    console.warn("createInheritedModel() > no parent screen child with id > " + parentID + ">" + parentWidget);
                                }
                            }
                        } else {
                            console.warn("createInheritedModel() > Deteced Self inheritance...", screen);
                        }
                    } else {
                        console.warn("createInheritedModel() > no parent screen with id > " + parentID);
                    }
                }
            }
        }
        return inModel;
    }

    _addRulersFromParent (screen, parent) {
        if (parent.rulers) {
            if (!screen.rulers) {
                screen.rulers = []
            }
            parent.rulers.forEach(ruler => {
                let copy = lang.clone(ruler);
                copy.inherited = ruler.id
                screen.rulers.push(copy)
            })
        }
    }

    createContaineredModel(inModel) {
        for (let screenID in inModel.screens) {
            let screen = inModel.screens[screenID];
            for (let i = 0; i < screen.children.length; i++) {
                let widgetID = screen.children[i];
                let widget = inModel.widgets[widgetID];
                if (widget) {
                    if (widget.isContainer){
                        let children = this.getContainedChildWidgets(widget, inModel)
                        widget.children = children.map(w => w.id)             
                    }
                } else {
                    /**
                     * FIXME: This can happen for screen copies... 
                     */
                    // console.warn('Core.createContaineredModel() > cannot find widgte', widgetID)
                }
            }
        }
    }

    static addContainerChildrenToModel (model) {
        /**
         * Add here some function to add the virtual children, so that stuff
         * works also in the analytic canvas. This would mean we would have to 
         * copy all the code from the Repeater to here...
         */
        return model
    }


    mixin(a, b, keepTrack) {
        if (a && b) {
            b = lang.clone(b);
            if (keepTrack) {
                b._mixed = {};
            }

            for (var k in a) {
                if (b[k] === undefined || b[k] === null) {
                    b[k] = a[k];
                    if (keepTrack) {
                        b._mixed[k] = true;
                    }
                }
            }
        }
        return b;
    }

    mixinNotOverwriten(a, b) {
        if (a && b) {
            var mixed = {};
            if (b._mixed) {
                mixed = b._mixed;
            }
            //console.debug("mixinNotOverwriten", overwriten)
            for (var k in a) {
                if (b[k] === undefined || b[k] === null || mixed[k]) {
                    b[k] = a[k];
                }
            }
        }
        return b;
    }

    getStartScreen(model) {
        if (!model) {
            model = this.model;
        }
        for (var id in model.screens) {
            var screen = model.screens[id];
            if (screen.props.start) {
                return screen;
            }
        }
        return null;
    }


    stripHTML (s){
        if(!s)
            s="";
        s = s.replace(/<\/?[^>]+(>|$)/g, "");
        s = s.replace(/%/g, "$perc;"); // Mongo cannot deal with % on undo
        return s;
    }
    
    unStripHTML (s) {
        if(!s){
            s="";
        }
        s = s.replace(/\$perc;/g, "%"); 
        return s;
    }
    
    setInnerHTML (e, txt){
        if(e){
            txt =  this.stripHTML(txt);
            txt =txt.replace(/\n/g, "<br>");
            txt =txt.replace(/\$perc;/g, "%"); // Mongo cannot deal with % on undo
            e.innerHTML = txt;
        } else {
            console.warn("setInnerHTML() > No node to set test > ", txt);
        }
    }

    _isContainedInBox (obj, parent) {
        if (parent) {
            if (
                obj.x >= parent.x &&
                obj.x + obj.w <= parent.w + parent.x &&
                (obj.y >= parent.y && obj.y + obj.h <= parent.y + parent.h)
                ) {
                return true;
            }
        }
        return false;
    }


    getHoverScreen (box) {
        return this._getHoverScreen(box, this.model);
    }

    _getHoverScreen (box, model) {
        return ModelGeom.getHoverScreen(box, model);
    }

    _isBoxChild (obj, parent) {
        if (
            obj.x + obj.w < parent.x ||
            parent.x + parent.w < obj.x ||
            obj.y + obj.h < parent.y ||
            parent.y + parent.h < obj.y
        ) {
            return false;
        }
        return true;
    }


    /**
     * Zvalue
     */

    getNormalizeWidgetZValues (values) {
        /**
         * convert values to a sorted list!
         */
        var list = [];
        for (var id in values) {
          list.push({
            id: id,
            z: values[id]
          });
        }
        this.sortWidgetList(list);
  
        var z = -1;
        var lastZ = null;
        var result = {};
        for (var i = 0; i < list.length; i++) {
          var w = list[i];
          if (lastZ === null || lastZ != w.z) {
            z++;
            lastZ = w.z;
          }
          result[w.id] = z;
        }
  
        return result;
    }
  
    getMinZValue (widgets) {
        var min = 100000;
        var l = 0;
        for (var id in widgets) {
            var w = widgets[id];
            min = Math.min(w.z, min);
            l++;
        }
        if (l > 0) {
            return min;
        } else {
            return 0;
        }
    }

    getMaxZValue (widgets) {
        var max = -10000;
        var l = 0;
        for (var id in widgets) {
            var w = widgets[id];
            max = Math.max(w.z, max);
            l++;
        }
        if (l > 0) {
            return max;
        } else {
            return 0;
        }
    } 

    getZValues (widgets) {
        var values = {};
        for (var id in widgets) {
            var widget = widgets[id];
            this.fixMissingZValue(widget);
            values[id] = widget.z;
        }
        return values;
    }

    isFixedWidget (w) {
        if (w.style && w.style.fixed) {
            return true;
        }
        return false;
    }

    /**
     * FIX for old models without z-value
     */
    fixMissingZValue (box) {
        if (box.z === null || box.z === undefined) {
            box.z = 0;
        }
    }


      /**
       * Get children
       */

    getOrderedWidgets (widgets) {
        var result = [];
        for (var id in widgets) {
            var widget = widgets[id];
            if (widget) {
                this.fixMissingZValue(widget);
                result.push(widget);
            } else {
                var e = new Error("getOrderedWidgets() > no widget with id " + id);
                if (this.logger) {
                    this.logger.sendError(e);
                }
            }
        }
        this.sortWidgetList(result);
        return result;
    }

    /**
     * Sort Screen children to render them in the correct order!
     *
     * Pass the children as parameter
     */
    sortChildren (children) {
        var result = [];
        for (var i = 0; i < children.length; i++) {
            var widgetID = children[i];
            var widget = this.model.widgets[widgetID];
            if (widget) {
            this.fixMissingZValue(widget);
            result.push(widget);
            }
        }

        this.sortWidgetList(result);

        //console.debug("sortChildren > ", result);
        return result;
    }

    /**
     * This method is super important for the correct rendering!
     *
     * We sort by:
     *
     *  1) style.fixed: fixed elements will be renderd last, therefore they come
     *  as the last elements in the list
     *
     * 	2) inherited : inherited values come first. They shall be rendered below the
     *  widget of the new screen
     *
     *  3) z : High z values come later
     *
     *  4) id: if the z value is the same, sort by id, which means the order the widgets have been
     *  added to the screen.
     */
    sortWidgetList (result) {
        /**
         * Inline function to determine if a widget is fixed.
         * we have to check if style exists, because the Toolbar.onToolWidgetLayer()
         * call the method without styles.
         */
        var isFixed = function(w) {
            if (w.style && w.style.fixed) {
            return true;
            }
            return false;
        };

        result.sort(function(a, b) {
            var aFix = isFixed(a);
            var bFix = isFixed(b);

            /**
             * 1) Sort by fixed. If both are fixed or not fixed,
             * continue sorting by inherited.
             */
            if (aFix == bFix) {
            /**
             * If both a inherited or not inherited,
             * continue sorting by z & id
             */
            if ((a.inherited && b.inherited) || (!a.inherited && !b.inherited)) {
                /**
                 * 4) if the have the same z, sot by id
                 */
                if (a.z == b.z && (a.id && b.id)) {
                return a.id.localeCompare(b.id);
                }

                /**
                 * 3) Sort by z. Attention, Chrome
                 * needs -1, 0, 1 or one. > does not work
                 */
                return a.z - b.z;
            }
            if (a.inherited) {
                return -1;
            }

            return 1;
            }
            if (aFix) {
            return 1;
            }
            return -1;
        });
    }


    getModelChildren (screen) {
        var result = [];

        for (let id in this.model.widgets) {
            let pos = screen.children.indexOf(id);
            if (pos >= 0) {
            result.push(this.model.widgets[id]);
            }
        }

        return result;
    }


     /***************************************************************************
     * Line helpers
     ***************************************************************************/

    getToLines (box) {
        var result = [];

        for (var id in this.model.lines) {
            var line = this.model.lines[id];
            if (line.to == box.id) {
            result.push(line);
            }
        }

        return result;
    }

    getLines (box, deep) {
        var result = [];

        var _ids = {};

        for (let id in this.model.lines) {
            let line = this.model.lines[id];
            if (line.to == box.id || line.from == box.id) {
            result.push(line);
            _ids[line.id] = true;
            }
        }

        if (box.children && deep) {
            for (let i = 0; i < box.children.length; i++) {
            let childID = box.children[i];
            for (let id in this.model.lines) {
                let line = this.model.lines[id];
                if (!_ids[line.id]) {
                if (line.from == childID || line.to == childID) {
                    result.push(line);
                }
                }
            }
            }
        }

        return result;
    }

    hasLine (widget) {
        for (let id in this.model.lines) {
            let line = this.model.lines[id];
            if (line.from == widget.id) {
            return true;
            }
        }
        return false;
    }

    getLine (widget) {
        for (let id in this.model.lines) {
            let line = this.model.lines[id];
            if (line.from == widget.id) {
            return line;
            }
        }
        return null;
    }

    /**
     * For all line drawing this function returns the widget, or in case of an
     * group the bounding box!
     */
    getFromBox (line) {
        var fromPos = this.model.widgets[line.from];

        if (!fromPos) {
            fromPos = this.model.screens[line.from];
        }

        if (!fromPos && this.model.groups) {
            /**
             * no widget, must be a group
             */
            var group = this.model.groups[line.from];
            if (group) {
            fromPos = this.getBoundingBox(group.children);
            }
        }

        return fromPos;
    }

    getToBox (line) {
        var to = this.model.screens[line.to];
        if (!to) {
            to = this.model.widgets[line.to];
        }
        return to;
    }
  
    static getChildScreens (model, screen) {
        return Object.values(model.screens).map(s => {
            if (s.parents) {
                if (s.parents.indexOf(screen.id) >= 0) {
                    return s
                }
            }
            return null
        }).filter(s => s !== null)
    }

    static getParentScreens (model, screen) {
        let result = []
        if (screen.parents) {
            for (let i = 0; i < screen.parents.length; i++) {
                let parentID = screen.parents[i];
                if (parentID != screen.id) {
                    let parentScreen = model.screens[parentID];
                    if (parentScreen) {
                        result.push(parentScreen)
                    }
                }
            }
        }
        return result
    }

    getAllRulers (screen) {
        let result = []
        if (screen.rulers) {
            result = result.concat(screen.rulers)
        }
        let parents = Core.getParentScreens(this.model, screen)
        parents.forEach(parentScreen => {
            if (parentScreen.rulers) {
                result = result.concat(parentScreen.rulers)
            }
        })
        return result
	}


}