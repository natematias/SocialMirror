//View ListView
var SplashView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "touchend #start": "startSurvey",
      "touchend #demo": "startDemo",
      "touchend #name_button": "saveName",
      "touchend #bullseye_auxilliary": "reportRelationships", // sidebar
      "touchstart .bullseye_option": 'startOptionDrag', // dragging options
      "touchmove .bullseye_option": 'continueDragging',
      "touchend .bullseye_option": 'endOptionDrag',
      "touchstart #bullseye_options": 'startScrolling', // scrolling option bar
      "touchmove #bullseye_options": 'continueScrolling',
      "touchend #bullseye_options": 'endScrolling'
    }:{
      "click #start": "startSurvey",
      "click #demo": "startDemo",
      "click #name_button": "saveName",
      "click #bullseye_auxilliary": "reportRelationships", //sidebar
      "mousedown .bullseye_option": 'startOptionDrag', // dragging options
      "mousemove .bullseye_option": 'continueDragging',
      "mouseup .bullseye_option": 'endOptionDrag',
      "mouseout .bullseye_option": 'continueDragging', // scrolling option bar
      "mousedown #bullseye_options": 'startScrolling',
      "mousemove #bullseye_options": 'continueScrolling',
      "mouseup #bullseye_options": 'endScrolling',
      "mouseout #bullseye_options": 'endScrolling'
    }
  },

  initialize: function(){
    _.bindAll(this, 'render', 'loadMLGroups', 'startDemo', 'drawBullseye', 'startOptionDrag', 'continueDragging', 'recordParticipantMLGroupRelationship', 'reportRelationships', 'saveOrUpdateRelationship', 'removeRelationship', 'startScrolling', 'continueScrolling', 'endScrolling');

    this.participants = new Participants();
    this.mlgroups = new MLGroups();
    this.relationships = new ParticipantMLGroupRelationships();
    this.dragging = null;

    this.current_participant = new Participant({name:"Default", member_status:"Default", years:0, role:"Default"});
    this.participants.add(this.current_participant);

    this.loadMLGroups();
    this.render();
  },
   
  render: function(){
   $(this.el).load("templates/splash.template");
  },

  startSurvey: function(){
   $("#initial_buttons_view").load("templates/enter_name.template");
  },

  startDemo: function(e){
    this.cleanEvent(e);
    //$(this.el).load("templates/bullseye.template");
    that = this;
    $.ajax({url:"templates/bullseye.template",
              type: "GET",
              dataType: "text",
              success: function(data){
                $(that.el).html(_.template(data, {groups:that.mlgroups}));
                that.drawBullseye();
              }
    });
  },

  saveName: function(){
    alert("Save Name");
  },
 
  drawBullseye: function(){

    canvas_element = document.getElementById("bullseye_canvas");
    if(canvas_element.getContext){
      this.canvas = canvas_element.getContext('2d');
      midpoint = canvas_element.offsetWidth/2;
      height = canvas_element.offsetHeight * 2 + 60;
      // bullseye_origin and bullseye_distance are used to calculate categories
      this.bullseye_origin = {x:midpoint, y:height}
      this.bullseye_distances = {medium:height*0.88, small: height*0.73}
      bottom_offset = 60;
      middle_offset = 0;
      // draw inner circle
      this.canvas.fillStyle= "rgb(255,255,230)";
      this.canvas.fillRect(0,0,midpoint*2, height);
      this.canvas.beginPath();  
      this.canvas.fillStyle = "rgb(255,220,186)";
      this.canvas.arc(midpoint,height, this.bullseye_distances.medium,0,(Math.PI/180)*180,true)
      this.canvas.fill();
      this.canvas.beginPath();
      this.canvas.fillStyle = "rgb(137,190,204)";
      this.canvas.arc(midpoint, height, height*0.73,0,(Math.PI/180)*180,true)
      this.canvas.fill();
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
 
    this.dragpoint_offset_x = ml_option.width();
    // 12 because that is the font size
    this.dragpoint_offset_y = ml_option.height();
    ml_option.css({"position":"absolute"});
    ml_option.addClass("dragging");
    ml_option.css({"left": pageX-this.dragpoint_offset_x, "top": pageY-this.dragpoint_offset_y})
  },

  continueDragging: function(e){
    ml_option = $(e.target);
    if(this.dragging!=null && ml_option.get(0) === this.dragging.get(0)){
    }else{
      return;
    }
    if( navigator.userAgent.match(/Android/i) ) {
      e.preventDefault();
      pageX = e.originalEvent.touches[0].pageX;
      pageY = e.originalEvent.touches[0].pageY;
    }else{
      pageX = e.pageX;
      pageY = e.pageY;
    }
    if(this.dragpoint_offset_x){
      ml_option.css({"left": pageX-this.dragpoint_offset_x, "top": pageY-this.dragpoint_offset_y})
    }
    return true;
  },

  endOptionDrag: function(e){
    unzoom_multiplier = 0.25;
    ml_option = $(e.target);

    if(ml_option.offset().left + (ml_option.width()/7) < $("#bullseye_options").width()){
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
 
  reportRelationships: function(element){
    that = this;
    report_string = ""
    this.relationships.each(function(relationship){
      report_string += relationship.get("group").get("name") + ": " + relationship.get("type");
      report_string +="\n"
    });
    alert(report_string);
  },

  loadMLGroups: function(){
    var that = this;
    jQuery.getJSON("data/medialab_groups.json", function(data){
       $.each(data, function(key, value){
         group = new MLGroup({name:value});
         that.mlgroups.add(group);
       });
     });
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

  // Scrollbar handlers
  startScrolling: function(e){
    option_bar = $(e.target);
    this.scrollOrigin = option_bar.scrollTop();
    this.scrollTouchOrigin = this.getTouchLocation(e);
    this.scrolling = true;
  },

  continueScrolling: function(e){
    if(this.scrolling){
      current_location = this.getTouchLocation(e);
      $(e.target).scrollTop(this.scrollOrigin + (this.scrollTouchOrigin.y - current_location.y));
    }
  },

  endScrolling: function(e){
    this.scrollOrigin = null;
    this.scrolling = false;
  },

  cleanEvent: function(e){
    e.stopPropagation()
    e.preventDefault()
  }
});
window.MOBILE = navigator.userAgent.match(/mobile/i);
var splashView = new SplashView;
$("#frame").html(splashView.el);
