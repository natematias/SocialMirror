var SocialMirrorRouter = Backbone.Router.extend({
  routes: {
    "splash": "splash",
    "position": "position",
    "participant":"participantInformation"
  },
  
  splash: function(){
    splashView.render();
  },

  position: function(){
    splashView.positionView();
  },
 
  participantInformation: function(){
    splashView.participantSurvey();
  }

});
var router = new SocialMirrorRouter();
Backbone.history.start({pushState: false, root: "/medialab/socialmirror/"})
