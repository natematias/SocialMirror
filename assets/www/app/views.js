//View ListView
var SplashView = Backbone.View.extend({
     
  events: function() {
    return MOBILE ?
    {
      "touchend #discard": "restartSurvey",
      "touchend #save_survey": "saveSurvey",
      "touchend #data_button": "displayData",
      "touchstart #bullseye_options": 'startScrolling', // scrolling option bar
      "touchmove #bullseye_options": 'continueScrolling',
      "touchend #bullseye_options": 'endScrolling'
    }:{
      "click #discard": "restartSurvey",
      "click #save_survey": "saveSurvey",
      "click #data_button": "displayData",
    }
  },

  initialize: function(){
    _.bindAll(this, 'render', 'loadMLGroups', 'positionView', 'drawBullseye', 'recordParticipantMLGroupRelationship', 'participantSurvey', 'saveOrUpdateRelationship', 'startScrolling', 'continueScrolling', 'endScrolling', 'saveSurvey', 'displayData');

    this.bullseye_move_view = null;

    this.participants = new Participants();
    this.mlgroups = new MLGroups();
    this.relationships = new ParticipantMLGroupRelationships();
    this.records = new SMRecords();
    this.records.fetch();
    this.dragging = null;

    //this.current_participant = new Participant({name:"Default", member_status:"Default", years:0, role:"Default"});
    this.participants.add({name:"Default", member_status:"Default", years:0, role:"Default"});
    this.current_participant = this.participants.first();

    this.bullseye_option_template =  _.template('<div class="bullseye_option" id="<%=name%>"><%=name%></div>');

    this.loadMLGroups();
    this.render();
  },
   
  render: function(){
   $(this.el).load("templates/splash.template");
  },

  positionView: function(){
    //$(this.el).load("templates/bullseye.template");
    that = this;
    $.ajax({url:"templates/bullseye.template",
              type: "GET",
              dataType: "text",
              success: function(data){
                $(that.el).html(_.template(data, {groups:that.mlgroups, close_label:"collaboration", middle_label:"connection", far_label:"inspiration"}));
                that.drawBullseye();
                that.bullseye_move_view = new BullseyeMoveView({el:$("#frame")});
              }
    });
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
 
  loadMLGroups: function(){
    var that = this;
    jQuery.getJSON("data/medialab_groups.json", function(data){
       $.each(data, function(key, value){
         group = new MLGroup({name:value});
         that.mlgroups.add(group);
       });
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
  },
  
  // survey saving and discarding methods
  participantSurvey: function(element){
    that = this;
    $.ajax({url:"templates/participant.template",
              type: "GET",
              dataType: "text",
              success: function(data){
                $(that.el).html(_.template(data));
              }
    });
  },

  saveSurvey: function(element){
    var report_array = new Array()
    this.relationships.each(function(relationship){
      report_array.push(relationship.toJSON());
    });
    participant_information = {affiliation: $("#affiliation").val(),
                               connection_years: $("#connection_years").val()}
                               
    report_array.push(participant_information);
    this.records.create(report_array);
    this.restartSurvey();
  },
  
  displayData: function(element){
    that = this;
    report_string = "";
    this.records.fetch();
    this.records.each(function(record){
      report_string += JSON.stringify(record.toJSON()) + ",\n";
    });
    $("#initial_buttons_view").append(_.template("<div id='data_area'><textarea id='data_textarea'><%=report_string%></textarea></div>", {report_string:report_string}));
    //alert(report_string);
  },

  restartSurvey: function(){
    window.location = window.location.toString().split("#")[0];
  }
});
window.MOBILE = (navigator.userAgent.match(/mobile/i) || navigator.userAgent.match(/Playbook/i))
var splashView = new SplashView;
$("#frame").html(splashView.el);
