  // name
  // member status
  // years
  // role
  // id
  var Participant = Backbone.Model.extend({
  });

  // name
  var MLGroup = Backbone.Model.extend({
  });

  // MLGroup
  // Participant
  // RelationshipType
  var Relationship = Backbone.Model.extend({
  });

  var MLGroups = Backbone.Collection.extend({
    model: MLGroup
  });

  var Participants = Backbone.Collection.extend({
    model: Participant
  });

  var ParticipantMLGroupRelationships = Backbone.Collection.extend({
  });

  var SMJSON = Backbone.Model.extend({
  });

  var SMRecords = Backbone.Collection.extend({
    model:SMJSON,
    localStorage: new Backbone.LocalStorage("SocialMirror")
  });
