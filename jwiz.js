//General Javascript for wizard interface


;( function( $, window, document, undefined ) {
"use strict";


$.widget( 'gli.wizard', {

	// These options are automatically extended as part of the widget functionality, then saved to this.options
    options: {
    	startingStep: 1,
    	stepClass: 'step',
    	trackerId: 'tracker',//tracker should be an ol with a number of li corresponding to the number of steps
    	trackerNames: [],//if no tracker names are provided, steps will use the existing li under the ol
						  //if tracker names are provided, the li will be created automatically 
    	stepIds: [],
		bindBtns: false,// Only set to true if using jQuery 1.7 or later
    	nextBtnId: 'next-step',
    	backBtnId: 'back-step',
    },

    // Initialization
    _create: function() {
    	// Hide all steps
		//  this.element will refer to the element that .wizard is called on
    	this._hideAllSteps();

    	// Variables
    	this._nextBtn = $( jQId( this.options.nextBtnId ) );
    	this._backBtn = $( jQId( this.options.backBtnId ) );
    	this._tracker = $( jQId( this.options.trackerId ) );
    	this._curStepNum = this.options.startingStep;

    	if( this.options.stepIds.length == 0 ) {// if using a step class to get the collection of steps
    		this._wizardSteps = this.element.children( jQclass( this.options.stepClass ) );
    	} else {// if using an array of specific ids to get the collection of steps
    		this._wizardSteps = $( parseIdArrayToSelector( this.options.stepIds ) );
    	}

    	this._totalStepNum = this._wizardSteps.length;

    	// Add necessary classes for CSS
    	this._addClasses( 'steps' );
    	if( this.options.trackerNames.length > 0 ) {//step names provided
			// This will empty the list of children and construct the correct list items
    		this._buildProgTrackerFromNames();
    	}
    	this._addClasses( 'tracker' );

    	//Add the data attributes for the steps (wizard steps must be defined)
    	this._addProgTrackerDataSteps();

    	// If indicated, automatically bind the next, back buttons
		// **This only works with jQuery 1.7 or later
    	if( this.options.bindBtns ) {
			// Save some items before entering a new scope
    		var nextBtn = this._nextBtn;
    		var backBtn = this._backBtn;
    		var that = this;
    		$( document ).ready( function() {
    			nextBtn.on( 'click', function() {
    				that.nextStep();
    			} );
    			backBtn.on( 'click', function() {
    				that.prevStep();
    			} );
    		} );
    	}

    	// Show the current step
    	this.goToStep( this._curStepNum );

    },

    _setOption: function( key, value ) {
    	// Properly set the options
    	this.options[key] = value;

    	// Other changes have to be made depending on what the key is
    	if( key == "stepIds" ) {
    		this._hideAllSteps();
    		//if new stepIds are set, the set of wizard steps must be updated
    		this._wizardSteps = $( parseIdArrayToSelector( value ) );
    		this._addClasses( 'steps' );
    		this._totalStepNum = this._wizardSteps.length;
    		if( this._curStepNum > this._totalStepNum ) {//make sure the current step is not out of range
    			this._curStepNum = this._totalStepNum;
    		}
    		this._addProgTrackerDataSteps();
    		this.goToStep( this._curStepNum );
    	}

    	if( key == "trackerNames" ) {//if the tracker steps are changed
    		this._buildProgTrackerFromNames();
    		this._addClasses( 'tracker' );
    		this.goToStep( this._curStepNum );
    		this._addProgTrackerDataSteps();
    	}

    	if( key == "nextBtnId" ) {
    		this._nextBtnId = $( jQId( value ) );
    	}

    	if( key == "backBtnId" ) {
    		this._backBtnId = $( jQId( value ) );
    	}

    	if( key == "trackerId" ) {
    		this._tracker = $( jQId( value ) );
    	}

    	if( key == "bindBtns" ) {
    		if( value ) {
    			this._nextBtn.on( 'click', function() {
    				this.nextStep();
    			} );
    			this._backBtn.on( 'click', function() {
    				this.prevStep();
    			} );
    		} else {
    			this._nextBtn.unbind( 'click' );
    			this._backBtn.unbind( 'click' );
    		}
    	}

    },

	//
	// Public methods
	//****************
    nextStep: function() {
    	// Increment the wizard to the next step
    	//
		// Usage: $( '#wizard-body' ).wizard( 'nextStep' );

    	if( this._curStepNum != this._totalStepNum ) {
    		window.setTimeout(
    			this._hideStep( this._curStepNum, 1 ), 10 );
    		window.setTimeout(
    			this._showStep( this._curStepNum + 1, 'fast' ), 200 );
    		this._incStepNum();
    	}

		// If we're on the last step, hide the "Next" button
    	if( this._curStepNum == this._totalStepNum ) {
    		this._hideBtn( 'next' );
    	}

		// Whenever we advance a step, make sure the "Back" button is shown
    	this._showBtn( 'back' );
    },

    prevStep: function() {
    	// Decrement the wizard the the previous step
    	//
		// Usage: $( '#wizard-body' ).wizard( 'prevStep' );

    	if( this._curStepNum != 1 ) {
    		window.setTimeout(
    			this._hideStep( this._curStepNum ), 10 );
    		window.setTimeout(
    			this._showStep( this._curStepNum - 1 ), 200 );
    		this._decStepNum();
    	}

		// If we're on the last step, hide the "Back" button
    	if( this._curStepNum == 1 ) {
    		this._hideBtn( 'back' );
    	}

    	// Whenever we go back a step, make sure "Next" button is shown
    	this._showBtn( 'next' );
    },

    goToStep: function( step ) {
    	// Go straight to the specified step (backwards or forwards)
    	//
    	// Usage: $( '#wizard-body' ).wizard( 'goToStep', 2 );

    	if( step >= 1 && step <= this._totalStepNum ) {
    		this._hideStep( this._curStepNum, 0 );
    		this._showStep( step, 'fast' );
    		this._curStepNum = step;
    	}

    	if( this._curStepNum == 1 ) {
    		this._hideBtn( 'back' );
    	}

    	if( this._curStepNum == this._totalStepNum ) {
    		this._hideBtn( 'next' );
    	}
    },

    getCurrentStepNumber: function() {
    	return this._curStepNum;
    },

	//
    // Private methods
	//*****************
    _hideStep: function( step, speed ) {
    	if( speed === undefined ) {
    		this._wizardSteps.eq( step - 1 ).hide();
    	} else {
    		this._wizardSteps.eq( step - 1 ).hide( 'fade', speed );
    	}

    	//this._updateTracker( step - 1 );
    },

    _showStep: function( step, speed ) {
    	if( speed === undefined ) {
    		this._wizardSteps.eq( step - 1 ).show();
    	} else {
    		this._wizardSteps.eq( step - 1 ).show( 'fade', speed );
    	}

    	this._updateTracker( step );
    },

    _updateTracker: function( latestCompletedStep ) {
    	//make sure this and all previous steps are marked completed
    	var trackerSteps = this._tracker.children();
    	if( latestCompletedStep == this._totalStepNum ) {
    		trackerSteps.removeClass( 'progtracker-todo progtracker-current' ).addClass( 'progtracker-done' );
    	} else {
    		trackerSteps.removeClass( 'progtracker-done progtracker-current' ).addClass( 'progtracker-todo' );
    		trackerSteps.eq( latestCompletedStep - 1 ).prevAll().removeClass( 'progtracker-todo progtracker-current' ).addClass( 'progtracker-done' );
    		trackerSteps.eq( latestCompletedStep - 1 ).removeClass( 'progtracker-todo progtracker-done' ).addClass( 'progtracker-current' );
    	}
    },

    _hideBtn: function( type ) {
    	if( type == 'back' ) {
    		//this._backBtn.hide();
    		this._backBtn.attr( 'disabled', true );
    	} else if( type == 'next' ) {
    		//this._nextBtn.hide();
    		this._nextBtn.attr( 'disabled', true );
    	}
    },

    _showBtn: function( type ) {
    	if( type == 'back' ) {
    		//this._backBtn.show();
    		this._backBtn.attr( 'disabled', false );
    	} else if( type == 'next' ) {
    		//this._nextBtn.show();
    		this._nextBtn.attr( 'disabled', false );
    	}
    },

    _incStepNum: function() {
    	this._curStepNum += 1;
    },

    _decStepNum: function() {
    	this._curStepNum -= 1;
    },

    _hideAllSteps: function() {
    	this.element.find( jQclass( this.options.stepClass ) ).hide();
    },

    _addProgTrackerDataSteps: function() {
    	var stepInd = 1;
    	this._wizardSteps.each( function() {
    		$( this ).attr( 'data-progtracker-step', stepInd.toString() );
    		stepInd++;
    	} );
	},

	_addClasses: function( type ) {
		if( type == 'tracker' ) {
			var i = 0;
			this._tracker.children( 'li' ).each( function() {
				$( this ).addClass( 'progtracker-todo' );
				i++;
			} );
			this._tracker.addClass( 'progtracker' );
			this._tracker.attr( 'data-progtracker-steps', i );

		} else if( type == 'steps' ) {
			this._wizardSteps.each( function() {
				$( this ).addClass( 'wizard-step' );
			} );
		}
	},

	_buildProgTrackerFromNames: function() {
		this._tracker.empty().attr( 'data-progtracker-steps', this.options.trackerNames.length.toString() );
		for( var i in this.options.trackerNames ) {
			this._tracker.append( '<li class="progtracker-todo">' + this.options.trackerNames[i] + '</li>' );
		}
	},

} );


// Helper functions

function jQId( idName ) {
    return '#' + idName;
}

function jQclass( className ) {
    return '.' + className;
}

function parseIdArrayToSelector( arr ) {
	var selector = "";
	for( var ind in arr ) {
		selector += jQId( arr[ind] ) + ',';
	}
	//slice the last comma
	selector = selector.slice( 0, -1 );
	return selector;
}

} )( jQuery, window, document );
