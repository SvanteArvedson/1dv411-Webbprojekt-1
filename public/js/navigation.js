jQuery(document).ready(function ($) {
	var perspectives = [$("#topView"), $("#blueView"), $("#redView"), $("#yellowView"), $("#greenView"), $("#preview")];

	//colorsArray holds all the colors that are awailable in the UI color selector
	var colorsArray = [];
	/**
	 * Populates colorsArray with colors from colorsModal.
	 */
	$('#colorsModal a').each(function (index, link) {
		if ($(link).attr('href') != '#random') {
			colorsArray.push($(link).attr('href'));
		}
	});

	var cb = new BUILDER.ConstructionArea($("#ThreeJScontainer"), perspectives, colorsArray);
	cb.renderPerspectives();

	//Represents the current open modal.
	var openModal = null;

	//Represents the chosen color.
	var chosenColor;

	/**
	 * Generates random cube colors per cube placed.
	 */
	$("#ThreeJScontainer").on("mousedown", function () {
		if (chosenColor == "#random") {
			cb.setCubeMaterial(chooseRandomColorFromColors());
		}
	});

	/**
	 * Toggles counter to hide/show it.
	 */
	$('.counterWrapper').on('click', 'a', function(event){
		event.preventDefault();
		if ($('#toggleArrow').text() === "<") {
			$('#toggleArrow').text(">");
			$('.counter').show();
		} else if ($('#toggleArrow').text() === ">") {
			$('#toggleArrow').text("<");
			$('.counter').hide();
		}
	});

	/**
	 * Menu click eventhandler.
	 */
	$('#menu').on('click', 'a', function (event) {
		event.preventDefault();

		/**
		 * If buildOption class do handleBuildOption, else do handleModalWindow.
		 */
		if ($(this).hasClass("buildOption")) {
			handleBuildOption($(this));
		} else {
			handleModalWindow($(this));
			//Corrects the size of perspectives!
			cb.renderPerspectives();
		}
	});

	/**
	 * Provides a more intuitive closing of modals.
	 * @param event
	 */
	$("#modal").click(function (event) {
		if (event.target.tagName == "DIV") {
			closeModal();
		}
	});

	/**
	 * Modal click eventhandler. Controls which function to use.
	 */
	$('#modal').on('click', 'a', function (event) {
		event.preventDefault();

		if ($(this).hasClass('color')) {
			setColor($(this));
		} else if ($(this).hasClass('sizeControl')) {
			setSize($(this));
		} else if ($(this).hasClass('perspective')) {
			setPerspective($(this));
		} else {
			if ($(this).attr('href') == '#import' || $(this).attr('href') == '#save') {
				handleModalWindow($(this));
			}
			if($(this).attr('href') == '#print'){
				closeModal();
				window.print();
			}
			if ($(this).attr('href') == '#reset') {
				cb.clearCubes();
				cb.renderPerspectives();
				$('#ThreeJScontainer').trigger('updateView');
				//closeModal();
			}
		}
	});

	/**
	 * Send GET to /api/{name} where name is model name.
	 * When successful, gets JSON, value with key "data" should be sent to
	 * the model through cb.loadModel();
	 */
	$("#Submit").on('click', function (event) {
		event.preventDefault();
		var name = $.trim($("#Name").val());
		var buildingSaver = new BUILDER.BuildingSaver();
		var alert = $('#alert');
		if (name == '' || name == null || name == undefined) {
			alert.text('Försök med ett annat namn :(');
		} else {
			if ($(this).val() == 'Hämta') {
				if (navigator.onLine) {
					// check api first
					var requestUrl = "api/" + name;
					$.ajax({
						type: "GET",
						url: requestUrl,
						statusCode: {
							200: function (result) {
								cb.loadModel(result.data);
								closeModal();
							},
							400: function (result) {
								// check in localStorage
								var result = buildingSaver.getBuilding(name);
								if (result) {
									//console.log(result);
									cb.loadModel(result);
									closeModal();
								} else {
									console.log("Could not find that building.");
									alert.text('Byggnaden hittades inte :(');
								}
							}
						}
					});
					// if offline
				} else {
					var result = buildingSaver.getBuilding(name);
					if (result) {
						cb.loadModel(result);
						closeModal();
					} else {
						alert.text('Byggnaden hittades inte :(');
					}
				}
			} else {
				var requestUrl = "api/create";
				var dataString = LZString.decompressFromBase64(cb.saveModel());

				if (navigator.onLine) {
					$.ajax({
						type: "POST",
						url: requestUrl,
						data: {name: name, model: dataString},
						statusCode: {
							201: function (result) {
								// save in localStorage
								buildingSaver.saveBuildings(JSON.parse(result.data));
								alert.text('Byggnaden sparades :)');
								closeModal();
							},
							400: function (result) {
								alert.text('Försök med ett annat namn :(');
							},
							503: function (result) {
								alert.text('Försök spara igen :(');
							}
						}
					});
					// if offline
				} else {
					// save building in localStorage
					if (buildingSaver.saveNewBuilding(name, dataString)) {
						closeModal();
					} else {
						alert.text('Försök med ett annat namn :(');
					}
				}
			}
		}
		return false;
	});

	/**
	 * Sets perspective.
	 * @param {jQuery element} element
	 */
	function setPerspective(element) {
		var perspective = element.attr("href");
		cb.perspective(perspective);
		closeModal();
	}

	$(".perspective .canvasWrapper").on("click", function (event) {
		event.preventDefault();
		var target = $("#perspective");
		target.css("background-image", "url(" + this.firstChild.toDataURL() + ")");
		target.removeClass("top red yellow green blue").addClass("chosen-view " + $(this).parents("div").attr("class"));
		$("#menu").data("target", $(this).attr("id"));
	});

	$('#topView').trigger('click');

	$("#ThreeJScontainer").on("updateView", function () {
		var menuTargetId = $("#menu").data("target");
		if (menuTargetId !== undefined) {
			var target = $("#perspective");
			var canvas = $("#" + menuTargetId).children()[0];
			target.css("background-image", "url(" + canvas.toDataURL() + ")");
		}
	});

	/**
	 * Sets base size.
	 * @param {jQuery element} element
	 */
	function setSize(element) {
		var href = element.attr("href");
		var currentSize = cb.getBaseSize();

		switch (href) {
			case "#up":
				if (currentSize < 10) {
					currentSize = parseInt(currentSize) + 1;
				} else {
					return;
				}
				break;
			case "#down":
				if (currentSize > 1) {
					currentSize = parseInt(currentSize) - 1;
				} else {
					return;
				}
				break;
		}
		;

		$('#sizePreview').text(currentSize);
		cb.setBaseSize(currentSize);
		cb.renderPerspectives();
		$('#ThreeJScontainer').trigger('updateView');
	}

	/**
	 * Sets color of cube.
	 * @param  {jQuery element} element
	 */
	function setColor(element) {
		var colorHex = element.attr("href");
		chosenColor = colorHex;
		//The hex will be "random" if the user selected the random color option
		if (colorHex == "#random") {
			colorHex = chooseRandomColorFromColors();
		}
		cb.setCubeMaterial(colorHex);
		handleBuildOption($('#cube'));
		closeModal();
	}

	/**
	 * Sets a resize event handler.
	 */
	$(window).resize(function (event) {
		cb.resize();
	});

	/**
	 * Handles build option.
	 * @param  {jQuery element} element
	 */
	function handleBuildOption(element) {
		if (element.hasClass('chosen')) {
			return;
		} else {
			$('.buildOption').removeClass('chosen');
			element.toggleClass('chosen');
			cb.toggleBuildMode();
		}
	}

	/**
	 * Opens or closes modal.
	 * @param  {jQuery element} element
	 */
	function handleModalWindow(element) {
		var href = element.attr('href');
		var areOpen = href !== openModal;

		closeModal();
		if (areOpen) {
			if (href == '#save' || href == '#import') {
				if (href == '#save') {
					$("#Submit").val('Spara');
				} else {
					$("#Submit").val('Hämta');
				}
				href = '#FormModal';
			}

			$('#modal').toggleClass('open');
			$(href).toggleClass('open');
			$('#alert').text('');
			$(".modalOption").toggleClass('faded');
			element.removeClass('faded');
			openModal = href;
			cb.enableOrDisableOrbit(false);
		}
	}

	/**
	 * Closes all modals and enables orbit again.
	 */
	function closeModal() {
		$(openModal).removeClass('open');
		$('#modal').removeClass('open');
		$('.modalOption').removeClass('faded');

		$("#Name").val("");

		openModal = null;
		cb.enableOrDisableOrbit(true);
	}

	/*
	 * Chooses a color from the colorsArray that holds all available colors.
	 */
	function chooseRandomColorFromColors() {
		return colorsArray[Math.floor((Math.random() * (colorsArray.length - 1)))];
	}
});