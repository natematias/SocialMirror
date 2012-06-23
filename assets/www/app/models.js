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
    model: MLGroup,
  });

  MLGroups.prototype.add = function(mlgroup){
    var isDupe = this.any(function(_group){
      return _group.get("name") === mlgroup.get("name");
    });
    if(isDupe){
      return false;
    }
    Backbone.Collection.prototype.add.call(this, mlgroup);
  };

  var Participants = Backbone.Collection.extend({
    model: Participant
  });

  var ParticipantMLGroupRelationships = Backbone.Collection.extend({
  });

  var MLGroupMLGroupRelationships = Backbone.Collection.extend({
    model: Relationship,
    localStorage: new Backbone.LocalStorage("SocialMirror")
  });

  var SMJSON = Backbone.Model.extend({
  });

  var SMRecords = Backbone.Collection.extend({
    model:SMJSON,
    localStorage: new Backbone.LocalStorage("SocialMirror")
  });
