(function($){
  var ListView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, 'render');
      this.render();
    },
     
    render: function(){
      $(this.el).append("<ul><li>hello world</li></ul>");
    }

  });
  var listView = new ListView;
  $("#frame").html(listView.el);
})(jQuery);
