  // name
  // member status
  // years
  // role
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
