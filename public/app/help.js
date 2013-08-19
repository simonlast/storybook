
HelpMenu = {};

HelpMenu.template = jQuery("#help-template").html();


HelpMenu.setupEvents = function($el){


  $buttons = $el.find("#button-icons");
  $videos = $el.find("#videos");


  $buttons.on("click", "img", function(e){
    $target = jQuery(e.target);

    $buttons.children().removeClass("active");
    $target.addClass("active");
  });

  $el.find("#help-close").on("touchend", function(ev){
    $el.css({'top': Math.floor(pjs.height) + 1 + 'px'});

    setTimeout(function(){
      $el.remove();
    }, 200);
  });
};

HelpMenu.create = function(){
  jQuery("body").append(HelpMenu.template);
  var $el = jQuery("#help");

  HelpMenu.setupEvents($el);
};