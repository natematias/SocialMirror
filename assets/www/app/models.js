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
    model: Participant,
    localStorage: new Backbone.LocalStorage("SMParticipants")
  });

  var ParticipantMLGroupRelationships = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("SMParticipantMLGroupRelationships")
  });
