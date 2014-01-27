CaptChat = {
  tCtx: {}, //Canvas context will be assigned here on page load
  fontSize: "20px",
	runScript: function(e) {
    if (e.keyCode == 13 && document.getElementById('input').value) {
      CaptChat.doTheThing();
      $('#messages').append('<br/>'); //New line between messages
      $('#messages').animate({ scrollTop: $('#messages').outerHeight() }, 700);
      document.getElementById('input').value = '';
		}
  },

  doTheThing: function(input) {
    input = input || document.getElementById('input').value;
    input = input.trim().replace(/\s+/g, ' ').split(' ');

    var message = $('<span/>', { class: 'aMessage' });

    for( var word in input ) {
      CaptChat.canvas.width(CaptChat.textWidth(input[word])+10);
      CaptChat.captchaIfy(input[word]);
      message.append(CaptChat.canvas.toImg());
      //CaptChat.appendImg(CaptChat.canvas.toImg());
      CaptChat.canvas.clear();
    }
    $('#messages').append(message);
  },

  captchaIfy: function(input) {
	  CaptChat.tCtx.font = "normal "+ CaptChat.fontSize +" MomsTypewriter"; //Set text fonts option for  canvas,html5 canvas: Text Option
		CaptChat.tCtx.strokeStyle = "#000000";				                  //HTML5 canvas: Text Option
		CaptChat.canvas.clear();                                              //Clear previous Canvas for redraw our captcha
		CaptChat.tCtx.strokeText(input,0,20,CaptChat.canvas.width());		  //Stroke random string to canvas
		CaptChat.tCtx.textBaseline = "middle";				                  //HTML5 canvas: Text Option,line in middle of text
	},

  canvas: {
    /*****THERE IS BASICALLY NO TYPE CHECKING, ONLY SEND ACTUAL WIDTH/HEIGHT VALUES KTHX*****/
    //width() returns width, width(width) sets width then returns confirmation
    width: function(width) {
      if( arguments.length ) {
        document.getElementById('textCanvas').width = width;
      }
      return document.getElementById('textCanvas').width;
    },

    //height() returns height, height(height) sets height then returns confirmation
    height: function(height) {
      if( arguments.length ){
        document.getElementById('textCanvas').height = height;
      }
      return document.getElementById('textCanvas').height;
    },

    clear: function(tCtx) {
      tCtx = tCtx || CaptChat.tCtx;
      tCtx.clearRect(0,0,CaptChat.canvas.width(),CaptChat.canvas.height());
    },

    toDataURL: function(tCtx) {
      tCtx = tCtx || CaptChat.tCtx;
      return tCtx.canvas.toDataURL;
    },

    toImg: function(tCtx) {
      tCtx = tCtx || CaptChat.tCtx;
      var	imageElem = document.createElement('img');
      imageElem.src = tCtx.canvas.toDataURL();

      return imageElem;
    },
  },

  // Returns actual pixel width of @param:text or everything inside #input if nothing passed
  textWidth : function(text) {
    text = text || document.getElementById('input').value;
    var textSpan = document.getElementById('textSpan');
    textSpan.style.fontSize = CaptChat.fontSize; //Makes sure we're measuring the right font size
    textSpan.innerHTML = text;
    console.log($(textSpan).width())
    return $(textSpan).width();
  },

  appendImg: function(img) {
	  var messages = document.getElementById('messages');
		messages.appendChild(img)
  },
};
