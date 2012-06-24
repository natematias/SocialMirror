//View ListView
var SplashView = Backbone.View.extend({
     
  events: function() {
    return window.MOBILE ?
    {
      "touchend #discard": "restartSurvey",
      "touchend #save_survey": "saveSurvey",
      "touchend #data_button": "displayData",
      "touchstart #bullseye_options": 'startScrolling', // scrolling option bar
      "touchmove #bullseye_options": 'continueScrolling',
      "touchend #bullseye_options": 'endScrolling',
      "touchend #toggle_connection": "toggleConnection"
    }:{
      "click #discard": "restartSurvey",
      "click #save_survey": "saveSurvey",
      "click #data_button": "displayData",
      "click #toggle_connection": "toggleConnection"
    }
  },

  initialize: function(){
    _.bindAll(this, 'render', 'loadMLGroups', 'positionView', 'drawBullseye', 'participantSurvey', 'saveOrUpdateRelationship', 'startScrolling', 'continueScrolling', 'endScrolling', 'saveSurvey', 'displayData', 'removeRelationship');

    this.checkEnvironment();
    this.bullseye_move_view = null;
    this.bullseye_connect_view = null;
    this.bullseye_mode = "move";

    this.bullseye_connect_view = null;

    this.connections = new MLGroupMLGroupRelationships();

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

  toggleConnection: function(e){
    toggle_button = $(e.target);
    if(this.bullseye_mode == "move"){
      this.bullseye_move_view.undelegateEvents();
      toggle_button.addClass("selected");

      if(this.bullseye_connect_view == null){
        this.bullseye_connect_view = new BullseyeConnectView({el: $("#frame")});
      }else{
        this.bullseye_connect_view.delegateEvents();
      }

      this.bullseye_mode = "connect";
    }else if(this.bullseye_mode == "connect"){
      toggle_button.removeClass("selected");
      this.bullseye_connect_view.undelegateEvents();
      this.bullseye_move_view.delegateEvents();
      this.bullseye_mode = "move";
    }
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
                that.bullseye_mode="move";
              }
    });
  },

  drawBullseye: function(){
    canvas_element = document.getElementById("bullseye_canvas");
    if(canvas_element.getContext){
      if(this.canvas == undefined){
        this.canvas = canvas_element.getContext('2d');
      }
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
      this.drawAllLinkLines();
    }
  },

  drawAllLinkLines: function(){
    var that = this;
    this.connections.each(function(connection, key){
      that.drawLinkLine(that.getElementCenter(connection.get("origin_el")), that.getElementCenter(connection.get("destination_el")));
    });
  },

  getElementCenter: function(el){
    var x = el.offset().left + el.width()/2 -  $('#bullseye_canvas').offset().left;
    var y = el.offset().top + el.height()/2 - $('#bullseye_canvas').offset().top;
    return {x: x, y:y};
  },

  drawLinkLine: function(origin_location, destination_location){
    this.canvas.lineWidth = 6;
    this.canvas.strokeStyle = "#633";
    this.canvas.lineCap="round";
    this.canvas.beginPath();
    this.canvas.moveTo(origin_location.x, origin_location.y);
    this.canvas.lineTo(destination_location.x, destination_location.y);
    this.canvas.closePath();
    this.canvas.stroke();
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

  saveConnection: function(origin_el, destination_el){
    var origin = this.mlgroups.where({name: this.htmlEncode(origin_el.text())})[0];
    var destination = this.mlgroups.where({name: this.htmlEncode(destination_el.text())})[0];
 
    found = this.connections.any(function(connection){
      return ((connection.attributes.origin.cid == origin.cid && connection.attributes.destination.cid == destination.cid) || (connection.attributes.origin.cid == destination.cid && connection.attributes.destination.cid == origin.cid));
    });
    if(found){
      return;
    }else{
      this.connections.add({origin: origin, destination: destination, origin_el: origin_el, destination_el: destination_el});
    }
  },
  
  saveOrUpdateRelationship: function(groupName, relationshipType){
    var that = this;
    var updated = null;
    //first check the list of current relationships
    this.relationships.each(function(relationship){
      if(that.htmlEncode(relationship.get("group").get("name"))==that.htmlEncode(groupName)){
        relationship.set("type", relationshipType);
        updated = true;
        return;
      }
    });
    if(updated){return}
    // if not, then add a new relationship
    this.mlgroups.each(function(group){
      if(that.htmlEncode(group.get("name")) == that.htmlEncode(groupName)){
        that.relationships.add({group:group, participant:that.participant,
                                type:relationshipType})
        return;
      }
    });
  },

  removeRelationship: function(groupName){
    that = this;
    var redraw = false;
    this.relationships.each(function(relationship){
      if(that.htmlEncode(relationship.get("group").get("name"))==that.htmlEncode(groupName)){
        var group = relationship.get("group");
        var found = new Array()
        that.connections.each(function(connection){
          if(connection.get("origin").cid == group.cid|| connection.get("destination").cid == group.cid){
            found.push(connection.cid);
          }
        });
        $.each(found, function(found_cid){
          redraw = true;
          that.connections.remove(found[found_cid]);
        });
        console.log(found);
        that.relationships.remove(relationship);
      }
    });
    if(redraw){
      this.drawBullseye();
    }
  },

  getTouchLocation: function(e){
    if(window.MOBILE) {
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
    console.log("SCROLLING IT STARTS");
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

  htmlEncode: function(value){
    return jQuery("<div/>").html(value).html();
  },
  
  checkEnvironment: function(){
    window.MOBILE = (navigator.userAgent.match(/mobile/i) || navigator.userAgent.match(/Playbook/i)|| navigator.userAgent.match(/Android/i))

  },

  restartSurvey: function(){
    window.location = window.location.toString().split("#")[0];
  }
});
console.log(navigator.userAgent);
var splashView = new SplashView;
$("#frame").html(splashView.el);
