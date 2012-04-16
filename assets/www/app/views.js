(function($){

  //View ListView
  var SplashView = Backbone.View.extend({
     
    events: {
      "click #start": "startSurvey",
      "click #demo": "startDemo",
      "click #name_button": "saveName"
    },

    initialize: function(){
      _.bindAll(this, 'render');
      this.render();
    },
     
    render: function(){
     //$(this.el).append("<ul><li>hello world</li></ul>");
     $(this.el).load("templates/splash.template");
    },

    startSurvey: function(){
     $("#initial_buttons_view").load("templates/enter_name.template");
    },
  
    startDemo: function(){
      alert("Start Demo");
    },

    saveName: function(){
      alert("Save Name");
    }

  });
  var splashView = new SplashView;
  $("#frame").html(splashView.el);
})(jQuery);
