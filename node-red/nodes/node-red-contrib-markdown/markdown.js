module.exports = function (RED) {
  var marked = require('marked');
  var highlight = require('highlight.js');
  // marked.setOptions({
  //   highlight: function (code, lang) {
  //     return highlight.highlightAuto(code, lang ? [lang] : null).value;
  //   }
  // });
  
  function Markdown(config) {
    RED.nodes.createNode(this, config);
    var self = this;
    this.on('input', function(msg) {
      msg.payload = marked(msg.payload);
      self.send(msg);
    });
  }

  RED.nodes.registerType('markdown', Markdown);

};
