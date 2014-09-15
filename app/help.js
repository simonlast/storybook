HelpMenu = {};

HelpMenu.template = jQuery("#help-template").html();

HelpMenu.setupEvents = function($el){
  $buttons = $el.find("#button-icons");
  $videos = $el.find("#videos");

  $buttons.on("click", "img", function(e){
    $target = jQuery(e.target);

    $buttons.children().removeClass("active");
    $target.addClass("active");

    var $children = $videos.children();
    $children.css({
      display: "none"
    });
    $children.each(function(i){
      $children[i].pause();
    });

    $show = $videos.children("#" + $target.attr("id"));

    $show[0].currentTime = 0;
    $show[0].play();

    $show.css({
      display: "block"
    });
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

  var $videos = $el.find("#videos").children();
  $videos.each(function(i){
    if(i > 0){
      var video = $videos[i];
      video.pause();
    }
  });

  HelpMenu.setupEvents($el);
};