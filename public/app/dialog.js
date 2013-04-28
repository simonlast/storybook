
var Dialog = {};

Dialog.template = jQuery("#dialog-template").html();

Dialog.dialog = function(onComplete){
	jQuery('body').append(Dialog.template);

	document.getElementById('cmd_finish_dialog').on("touchend", function(ev){
    	//ev.gesture.preventDefault();

    	var text = jQuery('#dialog-holder').val();
    	onComplete(text);

    	jQuery('#dialog-holder').css({'top': Math.floor(pjs.height) + 1 + 'px'});

		setTimeout(function(){
			jQuery('#dialog-holder').remove();
			jQuery('#cmd_finish_dialog').remove();
		}, 200);
	});
}
