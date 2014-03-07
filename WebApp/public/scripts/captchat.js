recipient = "";
CaptChat = {
	tCtx: {}, //Canvas context will be assigned here on page load
	font: {},
	fontSize: 20,
	runScript: function(e) {
		if (e.keyCode == 13 && document.getElementById('input').value) {
			switch(document.getElementById('input').value.split(' ', 1)[0]) {
				case '/cls': //Clear messages
					$('.js_messages').empty();
					break;
				default:
					this.doTheThing();
					$('.js_messages').append('<br/>'); //New line between messages
					$('.js_messages').animate({ scrollTop: $('.js_messages').prop('scrollHeight') }, 400, 'swing', function() {
										$('.js_messages').stop(); //Stop scroll to prevent it affecting user scrolling
									});
					break;
			}

			document.getElementById('input').value = '';
		}
	},

	doTheThing: function(input, partner) {
		input = input || document.getElementById('input').value;
		input = input.trim().replace(/\s+/g, ' ').split(' ');

		var message = $('<span/>', { class: partner ? 'partnerMessage' : 'aMessage' });
		var dataUrlMessage = []; //Array of image dataURLs

		var i = 0;
		for( var word in input ) { //Split message into individual words and Captcha each word
			CaptChat.canvas.width(CaptChat.font.measureText(input[word],CaptChat.fontSize).width+10);
			CaptChat.captchaIfy(input[word]);
			message.append(CaptChat.canvas.toImg());

			dataUrlMessage[i] = CaptChat.tCtx.canvas.toDataURL(); //Add dataURL

			CaptChat.canvas.clear();
			i++;
		}

		Connection.sendMessage({user: recipient, message: JSON.stringify(dataUrlMessage)}); //Stringify array and send to server
		$('.js_messages').append(message);
	},

	captchaIfy: function(input) {
		this.canvas.clear();	//Clear previous Canvas for redraw our captcha

		//Draws random lines behind word
		var numLines = Math.floor(Math.random() * (15 - 5 + 1) + 5);
		for (var i=0;i<numLines;i++) {
			var rX1 = Math.random() * this.canvas.width(); //Line start position
			var rY1 = Math.random() * this.canvas.height();
			var rX2 = Math.random() * this.canvas.width(); //Line end position
			var rY2 = Math.random() * this.canvas.height();
			var rR = Math.random() * 255; //Random colour for line
			var rG = Math.random() * 255;
			var rB = Math.random() * 255;

			//Draw that line
			this.tCtx.beginPath();
			this.tCtx.strokeStyle = 'rgb(' + rR + ',' + rG + ',' + rB + ')';
			this.tCtx.lineWidth = Math.random() * 1;
			this.tCtx.moveTo(rX1, rY1);
			this.tCtx.lineTo(rX2, rY2);
			this.tCtx.stroke();
		}

		var pos = 0;
		var baseLines = ["middle", "alphabetic"];
		var fMax = this.fontSize + 2;
		var fMin = this.fontSize - 2;
		this.tCtx.strokeStyle = "#000000";
		for (var j = 0; j < input.length; j++) {

			var fontSize = Math.floor(Math.random()*(fMax - fMin + 1) + fMin );
			var fontNum = Math.floor(Math.random() * ((fontNames.length-1) - 0 + 1) + 0);
			this.tCtx.font = "normal "+ fontSize +"px " + fontNames[fontNum];
			this.tCtx.textBaseline = baseLines[Math.floor(Math.random() * baseLines.length)];
			this.tCtx.lineWidth = Math.random() * (2 - 0.5) + 0.5;				//Randomish stroke widths
			this.tCtx.strokeText(input[j],pos,20);
			pos += this.font.measureText(input[j],fontSize).width;
		}
	},

	receiveMessage: function(message) { //Displays messages received from other people. Send JSON strinified array of dataURLS
		message = JSON.parse(message);
		var messageSpan = $('<span/>', { class: 'partnerMessage' });
		for (var i=0;i<message.length;i++) {
			var img = $('<img/>', { src: message[i] });
			messageSpan.append(img);
		}
		$('.js_messages').append(messageSpan);
		$('.js_messages').animate({ scrollTop: $('.js_messages').outerHeight() }, 400, 'swing', function() {
							$('.js_messages').stop(); //Stop scroll to prevent it affecting user scrolling
						});
		if (!document.hasFocus()) {
			$('#notify').get(0).play();
		}
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

	appendImg: function(img) {
		var messages = document.getElementByClassName('messages');
		messages.appendChild(img);
	},
};

Users = {
	contacts: {},
	self: {
		username: '',
		privateKey: {},
		publicKey: {},
	},

	addOwnKeys: function(keys) {
		this.self.privateKey = openpgp.key.readArmored(keys.privateKeyArmored);
		this.self.publicKey = openpgp.key.readArmored(keys.publicKeyArmored);
	},

	addContact: function(name, armoredPublicKey) { //Adds new contact. Public key MUST BE ARMORED.
		var key = openpgp.key.readArmored(armoredPublicKey);
		this.contacts[name] = key;
	},

	removeContact: function(name) { //Remove named user
		delete this.contacts[name];
	},

	getPublicKey: function(name) { //Return openpgp key object
		return this.contacts[name];
	}
};
