//View ListView
var SplashView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "click #start": "startSurvey",
      "click #demo": "startDemo",
      "click #name_button": "saveName",
      "touchstart .bullseye_option": 'startOptionDrag',
      "touchmove .bullseye_option": 'continueDragging',
      "touchend .bullseye_option": 'endOptionDrag'
    }:{
      "click #start": "startSurvey",
      "click #demo": "startDemo",
      "click #name_button": "saveName",
      "mousedown .bullseye_option": 'startOptionDrag',
      "mousemove .bullseye_option": 'continueDragging',
      "mouseup .bullseye_option": 'endOptionDrag',
      "mouseout .bullseye_option": 'continueDragging',
    }
  },

  initialize: function(){
    _.bindAll(this, 'render', 'loadMLGroups', 'startDemo', 'drawBullseye', 'startOptionDrag', 'continueDragging');

    this.participants = new Participants();
    this.mlgroups = new MLGroups();
    this.relationships = new ParticipantMLGroupRelationships();
    this.dragging = null;
    this.loadMLGroups();
    this.render();
  },
   
  render: function(){
   $(this.el).load("templates/splash.template");
  },

  startSurvey: function(){
   $("#initial_buttons_view").load("templates/enter_name.template");
  },

  startDemo: function(){
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
      bottom_offset = 60;
      middle_offset = 0;
      // draw inner circle
      this.canvas.fillStyle= "rgb(255,255,230)";
      this.canvas.fillRect(0,0,midpoint*2, height);
      this.canvas.beginPath();  
      this.canvas.fillStyle = "rgb(255,220,186)";
      this.canvas.arc(midpoint,height, height*0.88,0,(Math.PI/180)*180,true)
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
    if( navigator.userAgent.match(/Android/i) ) {
      e.preventDefault();
      pageX = e.touch.pageX;
      pageY = e.touch.pageY;
    }else{
      pageX = e.pageX;
      pageY = e.pageY;
    }
 
    this.dragpoint_offset_x = pageX - ml_option.offset().left
    // 12 because that is the font size
    this.dragpoint_offset_y = pageY - ml_option.offset().top + 12;
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
      pageX = e.touch.pageX;
      pageY = e.touch.pageY;
    }else{
      pageX = e.pageX;
      pageY = e.pageY;
    }
    if(this.dragpoint_offset_x){
      ml_option.css({"left": pageX-this.dragpoint_offset_x, "top": pageY-this.dragpoint_offset_y})
    }
  },

  endOptionDrag: function(e){
    unzoom_multiplier = 0.25;
    ml_option = $(e.target);
    drop_offset = ml_option.offset().left + ml_option.width()*unzoom_multiplier;
    ml_option.css({"position":"absolute"});
    ml_option.removeClass("dragging");
    ml_option.css({"left":drop_offset});
    ml_option.css({"top": ml_option.offset().top+4});// 12px font 2px padding
    this.dragpoint_offset_x = null;
    this.dragoint_offset_y = null;
    this.dragging = null;
  },

  loadMLGroups: function(){
    var that = this;
    jQuery.getJSON("data/medialab_groups.json", function(data){
       $.each(data, function(key, value){
         group = new MLGroup({name:value});
         that.mlgroups.add(group);
       });
     });
  }
});
window.MOBILE = navigator.userAgent.match(/mobile/i);
var splashView = new SplashView;
$("#frame").html(splashView.el);
