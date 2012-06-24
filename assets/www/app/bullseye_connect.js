//View ListView
var BullseyeConnectView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "touchstart .bullseye_option": 'startConnectionDragging', // dragging options
      "touchend .bullseye_option": "endTouchConnectionDragging",
      "touchend": "endTouchConnectionDragging",
      "touchmove .bullseye_option": 'continueTouchConnectionDragging'
    }:{
      "mousedown .bullseye_option": 'startConnectionDragging', // dragging options
      "mouseenter .bullseye_option": 'completeConnectionDragging', // dragging options
/*      "mouseenter .bullseye_option": 'continueTouchConnectionDragging',*/
      "mouseleave .bullseye_option": 'leaveConnectionDragging', // dragging options
/*      "mouseleave .bullseye_option": 'continueTouchConnectionDragging', */
      "mousemove #bullseye": 'continueTouchConnectionDragging',
/*      "mousemove .bullseye_option": 'continueTouchConnectionDragging',
      "mouseup #bullseye": "endTouchConnectionDragging",*/
      "mouseup .bullseye_option": "endTouchConnectionDragging",
      "mouseup #bullseye": 'noConnection',
      "mouseup .bullseye_option": 'successfulConnection',
      "mouseout #bullseye": 'continueTouchConnectionDragging' 
    }
  },

  initialize: function(){
    _.bindAll(this,"startConnectionDragging", "continueConnectionDragging", "leaveConnectionDragging", "noConnection", "successfulConnection", "continueTouchConnectionDragging", "endTouchConnectionDragging");
    splashView.checkEnvironment();
    this.canvas = splashView.canvas;
    this.participants = splashView.participants;
    this.mlgroups = splashView.mlgroups;
    this.relationships = splashView.relationships;
    this.records = splashView.records;
    this.dragging = null;
    this.drag_origin = null;
    this.drag_destination = null;
    this.bullseye_origin = splashView.bullseye_origin;
    this.bullseye_distances = splashView.bullseye_distances;
    this.bullseye_option_template =  splashView.bullseye_option_template;

    if(MOBILE){
      this.touchzone = 10;// add boundary space for touch detection
    }else{
      this.touchzone = 0;
    }

    this.draw_counter = 0;
  },

  startConnectionDragging: function(e){
    ml_option = $(e.target);
    if(this.dragging !=null){
      return;
    }else{
      this.dragging = true;
      this.drag_origin = ml_option;
      this.drag_origin_location = this.getElementCenter(ml_option);
      ml_option.addClass("connecting");
    }
  },

  getTouchingOption: function(e){
    that = this;
    var touch = this.getTouchLocation(e);
    var horiz_offset = $("#bullseye_options").width();
    var return_val = null;
 
    $.each($("#bullseye_options").children(), function(index, option){
      option = $(option);
      if(touch.x > (option.offset().left - horiz_offset - that.touchzone) && (touch.x < (option.offset().left + option.width() - horiz_offset + that.touchzone)) && touch.y > (option.offset().top - that.touchzone) && (touch.y < option.offset().top + option.height() + that.touchzone)){
        return_val = option;
      }
    });
    return return_val;
  },

  endTouchConnectionDragging: function (e){
    if(this.dragging==null || this.drawCounter()!=true){
      return;
    }

    this.drag_destination.removeClass("connecting");

    if(this.drag_destination != null){
      splashView.saveConnection(this.drag_origin, this.drag_destination);
      this.disableLineDragging();
    }else{
      this.disableLineDragging();
      splashView.drawBullseye();
    }

  },

  completeConnectionDragging: function (e){
    ml_option = $(e.target);
    if(this.dragging ==null){
      return;
    }
    ml_option.addClass("connecting");
    this.drawLinkLine(this.drag_origin_location, this.getElementCenter(ml_option));
  },

  leaveConnectionDragging: function(e){
    ml_option = $(e.target);
    if(this.dragging == null || ml_option.get(0) === this.drag_origin.get(0)){
      return;
    }
    ml_option.removeClass("connecting");
  },

  drawCounter: function(){
    if(this.draw_counter == 0){
      this.draw_counter += 1
      return true;
    }
    this.draw_counter += 1
    if(this.draw_counter >= 2){
      this.draw_counter = 0;
    }
    return false
  },

  continueTouchConnectionDragging: function(e){
    if(this.dragging==null || this.drawCounter()!=true){
      return;
    }

    touching_option = this.getTouchingOption(e); 
    if(touching_option == null || this.drag_origin.get(0) === touching_option.get(0)){
      //if we're moving off a destination:
      if(this.drag_destination != null){
        this.drag_destination.removeClass("connecting");
        this.drag_destination = null;
      }
      //draw the link line to the touch location
      touch = this.getTouchLocation(e);
      this.drawLinkLine(this.drag_origin_location, touch);
      return;
    }else{
      touching_option.addClass("connecting");
      // draw the link line to the centre of the destination element
      this.drawLinkLine(this.drag_origin_location, this.getElementCenter(touching_option));
      this.drag_destination = touching_option;
    }
  },

  continueConnectionDragging: function(e){
    if(this.dragging== null || this.drawCounter()!=true){
      return
    }

    touch = this.getTouchLocation(e);
    this.drawLinkLine(this.drag_origin_location, touch);
  },

  drawLinkLine: function(origin_location, destination_location){
    splashView.drawBullseye();
    splashView.drawLinkLine(origin_location, destination_location);
  },

  disableLineDragging: function(){
    this.dragging = null;
    this.drag_origin.removeClass("connecting");
    this.drag_origin = null;
    this.drag_origin_location = null;
  },

  noConnection: function(e){
    if(this.dragging!=null){
      this.disableLineDragging();
      splashView.drawBullseye();
    }
  },

  successfulConnection: function(e){
    ml_option = $(e.target);
    if(this.dragging!=null){
      splashView.saveConnection(this.drag_origin, ml_option);
      ml_option.removeClass("connecting");
      this.disableLineDragging();
    }
  },

  getElementCenter: function(el){
    var x = el.offset().left + el.width()/2 -  $('#bullseye_canvas').offset().left;
    var y = el.offset().top + el.height()/2 - $('#bullseye_canvas').offset().top;
    return {x: x, y:y};
  },

  isInside:function(option, target){
    var center_x = option.offset().left + option.width()/2;
    var center_y = option.offset().top + option.height()/2;
    var horiz_inside = (center_x > target.offset().left) && (center_x < target.offset().left + target.width());
    var vert_inside = (center_y > target.offset().top) && (center_y < target.offset().top + target.height());
    return horiz_inside && vert_inside;
  },

  getTouchLocation: function(e){
    if(MOBILE) {
      e.preventDefault();
      var pageX = e.originalEvent.touches[0].pageX;
      var pageY = e.originalEvent.touches[0].pageY;
    }else{
      var pageX = e.pageX;
      var pageY = e.pageY;
    }
   pageX -= $('#bullseye_canvas').offset().left;
   return {x: pageX, y:pageY};
  },

});
