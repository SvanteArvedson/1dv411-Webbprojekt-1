describe("Builder.ConstructionArea", function () {
	var builder;

	beforeEach(function () {
		builder = new BUILDER.ConstructionArea($("<div style='height: 1000px; width: 1000px;'></div>"));
	});

	describe("renderPerspectives", function () {

		it("should render all views", function () {
			// arrange
			builder._views.forEach(function(element, index, array) {
				spyOn(element, 'render');
				spyOn(element, 'setSize');
			});
			
			// act
			builder._renderPerspectives();
			
			// assert
			builder._views.forEach(function(element, index, array) {
				expect(element.render).toHaveBeenCalled();
				expect(element.setSize).toHaveBeenCalled();
			});
			
		});
		
	});
});