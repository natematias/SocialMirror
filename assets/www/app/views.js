//View ListView
var SplashView = Backbone.View.extend({
     
  events: {
    "click #start": "startSurvey",
    "click #demo": "startDemo",
    "click #name_button": "saveName"
  },

  initialize: function(){
    _.bindAll(this, 'render', 'loadMLGroups', 'startDemo', 'drawBullseye');

    this.participants = new Participants();
    this.mlgroups = new MLGroups();
    this.relationships = new ParticipantMLGroupRelationships();
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
var splashView = new SplashView;
$("#frame").html(splashView.el);
