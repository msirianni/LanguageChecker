(function() {
	var appParentSpace = this;

	return {
		events: {
			'app.activated': 'getRequesterLanguage',
			'ticket.save': 'checkLanguage'
		},
		requests: {
			detectLanguage: function(commentText) {
				return {
					url: 'http://ws.detectlanguage.com/0.2/detect?q=' + encodeURI(commentText).replace(/%20/g, '+') + '&key=6371fd05809a4dc1f5b3bb1f67500924',
					dataType: 'JSON',
					type: 'GET',
					contentType: 'application/json',
					proxy_v2: true
				};

			},
			getLocaleID: function(userID) {
				return {
					url: '/api/v2/users/' + userID + '.json',
					dataType: 'JSON',
					type: 'GET',
					contentType: 'application/json',
					proxy_v2: true
				};
			}
		},
		getRequesterLanguage: function() {
			var ticket = this.ticket();
			var user = ticket.requester();
			return this.promise(function(done, fail) {
				var comment = this.comment();
				this.ajax('getLocaleID', user.id())
					.then(function(jsonResponse) {
						console.log("Requester locale: " + jsonResponse.user.locale);
						this.requesterLocale = jsonResponse.user.locale;
						done();
					}, function() {
						console.log("Request Failed");
						fail();
					});
			});

		},
		checkLanguage: function() {
			return this.promise(function(done, fail) {
				var comment = this.comment();
				this.ajax('detectLanguage', comment.text())
					.then(function(jsonResponse) {
							if (this.setting(this.requesterLocale) === undefined) {
								this.transformedLocale = this.requesterLocale;
							} else {
								this.transformedLocale = this.setting(this.requesterLocale);
							}
							console.log("Comment language detected: " + jsonResponse.data.detections[0].language);
							this.store('dLanguage', jsonResponse.data.detections[0].language);
							console.log("Requester locale transformed: " + this.transformedLocale);
							this.store('rLanguage', this.transformedLocale);
							if (this.transformedLocale != jsonResponse.data.detections[0].language) {
								console.log("Doesn't match.");
								this.$('#myModal').modal();
								var self = this;

								self.$('.modal_submit').bind("click", function(clicked) {
									clicked.preventDefault();
									if (clicked.target.id == "modal_submit_continue") {
										console.log("Clicked continue.");
										appParentSpace.$('#ht_modal').modal('hide');
										appParentSpace.$('.modal-backdrop').remove();
										done();
									} else if (clicked.target.id == "modal_submit_close") {
										console.log("Clicked cancel.");
										fail(self.I18n.t('submit.cancel'));
									}

								});

								self.$('.modal-header button.close').bind("click", function() {
									console.log("Clicked close.");
									fail(self.I18n.t('submit.close'));
								});

								setTimeout(function() {
									fail(self.I18n.t('submit.timeout'));
									appParentSpace.$('#myModal').modal('hide');
									appParentSpace.$('.modal-backdrop').remove();
								}, 20000);

							} else {
								console.log("Match.");
								done();
							}

						},
						function() {
							console.log("Request Failed");
							fail();
						});
			});
		}
	};

}());