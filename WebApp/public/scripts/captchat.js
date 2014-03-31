recipient = "";

$(function() {
	$('.grabber').click(function(){
		var $messageWrapper = $('.messageWrapper');
		$messageWrapper.animate({width: $messageWrapper.prop('style').width == '100%' ? '80%' : '100%'}, 800, 'easeOutCubic');
		$(this).toggleClass('largeGrabber');
	});

	$('.contacts').click(function(e) {
		if ($(e.target).is(".contact")) {
			CaptChat.startConvo($(e.target).find('.name').html());
			CaptChat.selectConvo($(e.target).find('.name').html());
		} else if ($(e.target).is(".name")) {
			CaptChat.startConvo($(e.target).html());
			CaptChat.selectConvo($(e.target).html());
		} else if ($(e.target).is(".icon")) {
			CaptChat.startConvo($(e.target).next().html());
			CaptChat.selectConvo($(e.target).next().html());
		}
	});

	$('.tabs').click(function(e) { //Adding click event to container means we don't have to rebind the click event on every tab we add
		if ($(e.target).is('.tab') && !($(e.target).is('.empty'))) { //User clicked on tab
			CaptChat.selectConvo($(e.target).find('.tabName').html());
		} else if ($(e.target).is('.tabName')) {	//User clicked on name
			CaptChat.selectConvo($(e.target).html());
		}
	});
});

CaptChat = {
	tCtx: {}, //Canvas context will be assigned here on page load
	font: {},
	fontSize: 20,
	runScript: function(e) {
		if (e.which == 13 && document.getElementById('input').value) {
			switch(document.getElementById('input').value.split(' ', 1)[0]) {
				case '/cls': //Clear messages
					$('.messages-' + recipient).empty();
					break;
				case '/add':
					Connection.sendRequest(document.getElementById('input').value.substring(5).trim());
					console.log('Request send');
					break;
				case '/accept':
					Connection.acceptRequest(document.getElementById('input').value.substring(8).trim());
					break;
				default:
					this.doTheThing();
					$('.messages-' + recipient).append('<br/>'); //New line between messages
					$('.messages-' + recipient).animate({ scrollTop: $('.messages-' + recipient).prop('scrollHeight') }, 400, 'swing', function() {
										$(this).stop(); //Stop scroll to prevent it affecting user scrolling
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

		//JSON stringify then encrypt using recipients public key
		var encryptedMessage = JSON.stringify(dataUrlMessage);
		encryptedMessage = openpgp.encryptMessage([Users.contacts[recipient]], encryptedMessage);

		Connection.sendMessage({user: recipient, message: encryptedMessage}); //Stringify array and send to server
		$('.messages-' + recipient).append(message);
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

	receiveMessage: function(data) { //Displays messages received from other people. Send encrypted JSON strinified array of dataURLS
		//Decrypt using private key and parse the JSON
		var message = openpgp.decryptMessage(Users.self.privateKey, openpgp.message.readArmored(data.message));
		message = JSON.parse(message);

		var messageSpan = $('<span/>', { class: 'partnerMessage' });
		for (var i=0;i<message.length;i++) {
			var img = $('<img/>', { src: message[i] });
			messageSpan.append(img);
		}
		var messageWindow = $('.messages-' + data.from);
		if (!($('.messages-' + data.from)[0])) {
			CaptChat.startConvo(data.from);
			messageWindow = $('.messages-' + data.from);
		}
		messageWindow.append(messageSpan);
		messageWindow.animate({ scrollTop: messageWindow.prop('scrollHeight') }, 400, 'swing', function() {
										$(this).stop(); //Stop scroll to prevent it affecting user scrolling
									});
		if (!document.hasFocus()) {
			$('#notify').get(0).play();
		}
	},

	startConvo: function(username) {
		Connection.sendEvent( 'reqKey', username );
		if (!($('.messages-' + username)[0])) {
			var tab = $('<div/>').addClass('tab tab-' + username).append($(document.createElement('span')).addClass('tabName').html(username));
			$('.empty').before(tab);
			var messageWindow = $('<div/>', { class: 'messages-' + username + ' js_messages hidden'});
			$('.tabs').after(messageWindow);
		}
	},

	selectConvo: function(username) {
		if ($('.messages-' + username)[0]) {
			recipient = username;
			$('.selected').removeClass('selected');
			$('.tab-' + username).addClass('selected');
			$('.js_messages').addClass('hidden');
			$('.messages-' + username).removeClass('hidden');
		}
	},

	addToContacts: function(username, image) {
		var contact = $('<div/>').addClass('contact');
		contact.append($(document.createElement('img')).addClass('contactInfo icon').attr('src', image));
		contact.append($(document.createElement('span')).addClass('contactInfo name').html(username));
		$('.contacts').append(contact);
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
		var messages = document.getElementByClassName('messages-' + recipient);
		messages.appendChild(img);
	},
};

Users = {
	contacts: {},
	self: {
		username: '',
		privateKey: {},
		privateKeyArmor: '',
		publicKey: {},
		publicKeyArmor: ''
	},

	addOwnKeys: function(keys) {
		this.self.privateKeyArmor = keys.privateKeyArmored;
		this.self.publicKeyArmor = keys.publicKeyArmored;
		this.self.privateKey = openpgp.key.readArmored(keys.privateKeyArmored).keys[0];
		this.self.privateKey.decrypt(Connection.sessionID);
		this.self.publicKey = openpgp.key.readArmored(keys.publicKeyArmored).keys[0];
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
