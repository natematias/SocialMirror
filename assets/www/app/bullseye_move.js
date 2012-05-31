//View ListView
var BullseyeMoveView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "touchend #open_add_bullseye_option": "openAddBullseyeOption",
      "touchend #cancel_add_option": "cancelAddBullseyeOption",
      "touchend #add_option": "addBullseyeOption",
      "keypress #bullseye_option": "onBullseyeOptionEnter",
      "touchstart .bullseye_option": 'startOptionDrag', // dragging options
      "touchmove .bullseye_option": 'continueDragging',
      "touchend .bullseye_option": 'endOptionDrag',
    }:{
      "click #open_add_bullseye_option": "openAddBullseyeOption",
      "click #cancel_add_option": "cancelAddBullseyeOption",
      "click #add_option": "addBullseyeOption",
      "keypress #bullseye_option": "onBullseyeOptionEnter",
      "mousedown .bullseye_option": 'startOptionDrag', // dragging options
      "mousemove .bullseye_option": 'continueDragging',
      "mouseup .bullseye_option": 'endOptionDrag',
      "mouseout .bullseye_option": 'continueDragging' 
    }
  },

  initialize: function(){
    _.bindAll(this, 'startOptionDrag', 'continueDragging', 'recordParticipantMLGroupRelationship', 'saveOrUpdateRelationship', 'removeRelationship' );

    this.participants = splashView.participants;
    this.mlgroups = splashView.mlgroups;
    this.relationships = splashView.relationships;
    this.records = splashView.records;
    this.dragging = null;
    this.bullseye_origin = splashView.bullseye_origin;
    this.bullseye_distances = splashView.bullseye_distances;
    this.add_bullseye_option_template = null;

    this.bullseye_option_template =  splashView.bullseye_option_template;
  },
   
  onBullseyeOptionEnter: function(e){
    if(e.keyCode == 13){
      this.addBullseyeOption();
    }
  },

  addBullseyeOption: function(){
    option_input = $('#bullseye_option');
    var name = option_input.val();
    if(/[A-Za-z]/i.exec(name)==null){
      option_input.focus();
      return;
    }
    option_input.val("");
    option_input.focus();
    splashView.mlgroups.add(new MLGroup({name: name}))
    $('#bullseye_options').prepend(this.bullseye_option_template({name:name}));
  },

  cancelAddBullseyeOption: function(){
    $('.add_bullseye_option_dialogue').remove()
  },

  openAddBullseyeOption: function(){
    // cache the add template, to fix Blackberry Tablet issue
    if(this.add_bullseye_option_template != null){
      $(this.el).append(this.add_bullseye_option_template);
      $("#bullseye_option").focus()
    }else{
      that = this;
      $.ajax({url:"templates/add_bullseye_option.template",
                type: "GET",
                dataType: "text",
                success: function(data){
                  that.add_bullseye_option_template = _.template(data);
                  $(that.el).append(that.add_bullseye_option_template);
                  $('#bullseye_option').focus();
                }
      });
    }

  },
 
  startOptionDrag: function(e){
    ml_option = $(e.target);
    if(this.dragging !=null){
      return;
    }else{
      this.dragging = ml_option;
    }
    if(MOBILE) {
      e.preventDefault();
      var pageX = e.originalEvent.touches[0].pageX;
      var pageY = e.originalEvent.touches[0].pageY;
    }else{
      var pageX = e.pageX;
      var pageY = e.pageY;
    }
 
    ml_option.addClass("dragging");
    this.dragpoint_offset_x = ml_option.width()/2;
    this.dragpoint_offset_y = ml_option.height()/2;
    ml_option.css({"position":"absolute"});
    ml_option.css({"left": pageX-this.dragpoint_offset_x, "top": pageY-this.dragpoint_offset_y})
    splashView.drawBullseye();
  },

  continueDragging: function(e){
    e.preventDefault();
    ml_option = $(e.target);
    if(this.dragging!=null && ml_option.get(0) === this.dragging.get(0)){
    }else{
      return;
    }
    if(MOBILE) {
      e.preventDefault();
      pageX = e.originalEvent.touches[0].pageX;
      pageY = e.originalEvent.touches[0].pageY;
    }else{
      pageX = e.pageX;
      pageY = e.pageY;
    }

   if(this.isInside(ml_option, $('#bullseye_option_trash'))){
     $('#bullseye_option_trash').addClass("trash_hover");
   }else{
     $('#bullseye_option_trash').removeClass("trash_hover");
   }

    if(this.dragpoint_offset_x){
      ml_option.css({"left": pageX-this.dragpoint_offset_x, "top": pageY-this.dragpoint_offset_y})
    }
    splashView.drawBullseye();
    return true;
  },

  isInside:function(option, target){
    var center_x = ml_option.offset().left + ml_option.width()/2;
    var center_y = ml_option.offset().top + ml_option.height()/2;
    var horiz_inside = (center_x > target.offset().left) && (center_x < target.offset().left + target.width());
    var vert_inside = (center_y > target.offset().top) && (center_y < target.offset().top + target.height());
    return horiz_inside && vert_inside;
  },

  removeOption: function(option){
    group = splashView.mlgroups.where({name: option.text()});
    if(group){
      splashView.mlgroups.remove(group);
    }
    option.remove();
    $('#bullseye_option_trash').removeClass("trash_hover");
  },

  endOptionDrag: function(e){
    unzoom_multiplier = 0.25;
    ml_option = $(e.target);

    if(this.isInside(ml_option, $('#bullseye_option_trash'))){
      this.removeOption(ml_option);
    }else if(ml_option.offset().left + (ml_option.width()/7) < $("#bullseye_options").width()){
      ml_option.removeClass("dragging");
      ml_option.css({"position":"relative", "top":"auto", "left":"auto"});
      this.removeRelationship(ml_option.text());
    }else{
      drop_offset = ml_option.offset().left + ml_option.width()*unzoom_multiplier;
      ml_option.css({"position":"absolute"});
      ml_option.removeClass("dragging");
      ml_option.css({"left":drop_offset});
      ml_option.css({"top": ml_option.offset().top+4});// 12px font 2px padding
      this.recordParticipantMLGroupRelationship(ml_option);
      splashView.drawBullseye();
    }
    this.dragpoint_offset_x = null;
    this.dragoint_offset_y = null;
    this.dragging = null;
  },

  recordParticipantMLGroupRelationship: function(element){
    this.saveOrUpdateRelationship(element.text(), this.bullseyeCategory(element));
  },

  bullseyeCategory: function(element){
    //this.bullseye_origin = {x:midpoint, y:height}
    //this.bullseye_distances = {medium:height*0.88, small: height*0.73}
    center_x = element.offset().left + element.width()/2 - $("#bullseye_options").width();
    center_y = element.offset().top + element.height()/2;
    distance = Math.sqrt( Math.pow(this.bullseye_origin.x - center_x, 2) + 
                          Math.pow(this.bullseye_origin.y - center_y, 2));
    if(distance > this.bullseye_distances.medium){
      return "far";
    }else if(distance > this.bullseye_distances.small){
      return "medium";
    }else{
      return "close";
    }
  },
 
  removeRelationship: function(groupName){
    that = this;
    this.relationships.each(function(relationship){
      if(relationship.get("group").get("name")==groupName){
        that.relationships.remove(relationship);
      }
    });
  },

  saveOrUpdateRelationship: function(groupName, relationshipType){
    var that = this;
    var updated = null;
    //first check the list of current relationships
    this.relationships.each(function(relationship){
      if(relationship.get("group").get("name")==groupName){
        relationship.set("type", relationshipType);
        updated = true;
        return;
      }
    });
    if(updated){return}
    // if not, then add a new relationship
    this.mlgroups.each(function(group){
      if(group.get("name") == groupName){
        that.relationships.add({group:group, participant:that.participant,
                                type:relationshipType})
        return;
      }
    });
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
   return {x: pageX, y:pageY};
  },

});
