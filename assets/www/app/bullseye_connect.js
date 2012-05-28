//View ListView
var BullseyeConnectView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "touchstart .bullseye_option": 'startConnectionDragging', // dragging options
      "touchmove #bullseye": 'continueConnectionDragging',
      "touchend #bullseye": 'endConnectionDragging',
    }:{
      "mousedown .bullseye_option": 'startConnectionDragging', // dragging options
      "mouseenter .bullseye_option": 'completeConnectionDragging', // dragging options
      "mouseleave .bullseye_option": 'leaveConnectionDragging', // dragging options
      "mousemove #bullseye": 'continueConnectionDragging',
      "mouseup #bullseye": 'noConnection',
      "mouseup .bullseye_option": 'successfulConnection',
      "mouseout #bullseye": 'continueConnectionDragging' 
    }
  },

  initialize: function(){
    _.bindAll(this,"startConnectionDragging", "continueConnectionDragging");
    this.canvas = splashView.canvas;
    this.participants = splashView.participants;
    this.mlgroups = splashView.mlgroups;
    this.relationships = splashView.relationships;
    this.records = splashView.records;
    this.dragging = null;
    this.bullseye_origin = splashView.bullseye_origin;
    this.bullseye_distances = splashView.bullseye_distances;
    this.bullseye_option_template =  splashView.bullseye_option_template;

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

  continueConnectionDragging: function(e){
    canvas_element = $(e.target);
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
