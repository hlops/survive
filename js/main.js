$(function () {

    var DEFAULT_MENU = "about";

    var router;
    var $content, $menu, $subMenu;
    var $oldSection, $section;
    var processors = [];

    function galleryImageLoaded() {
        var $img = $(this);
        $img.removeAttr("width").removeAttr("height").css({ width: "", height: "" });
        if ($img.height() > 0) {
            $img.removeClass("undecided");
            if ($img.width() / $img.height() > 25.6 / 19) {
                $img.addClass("wide");
            }
            $img.parent().prettyPhoto();
        }
    }

    // init menu
    $.getJSON("menu.json", function (data) {
        var menu = ['<div class="menu"><ul>'];
        var i, item;
        for (i = 0; i < data.length; i++) {
            item = data[i];
            menu.push('<li><a href="#/', item.id, '" class="', item.id, '">', item.name, '</a></li>');
        }
        menu.push('</ul></div>');
        menu.push('<div class="sub-menu"></div>');

        $("body>.viewPort>nav").append(menu.join(""));

        $content = $("body>.viewPort>div.content");
        $menu = $("body>.viewPort>nav>div.menu");
        $subMenu = $("body>.viewPort>nav>div.sub-menu");

        router = new (Backbone.Router.extend({routes: {
            "*link": "menu"
        }}))();

        router.on('route:menu', function (arr) {
            arr = arr || DEFAULT_MENU;
            arr = arr.split("-");
            var link = arr[0], subMenuLink = arr[1];

            $section = $content.find(">section." + link);
            if (!$section.length) {
                $content.append("<section class='" + link + "'></section>");
                $section = $content.find(">section." + link);
                $section.load("partials/" + link + ".html article", function () {
                    var subMenu = ['<ul class="' + link + '">'], $item;
                    $section.find(">article").each(function () {
                        $item = $(this);
                        subMenu.push('<li><i class=', $item.attr("id"), '></i><a href="#/' + $item.attr("id") + '" class="', $item.attr("id"), '">', $item.attr("title"), '</a></li>');
                    });
                    subMenu.push('</ul>');

                    $subMenu.append(subMenu.join(""));
                    toggleMenu(link, subMenuLink);

                    // post process html
                    process();
                });
            } else {
                toggleMenu(link, subMenuLink);
            }

            return false;
        });

        Backbone.history.start();

    });

    function toggleMenu(menu, submenu) {
        if ($oldSection) $oldSection.hide();

        var fullPath = menu + "-" + submenu;
        if (!submenu) {
            fullPath = $section.find(">article:eq(0)").attr("id");
        }

        $section.css({"background-image": "url(img/icons/" + fullPath + ".png)"})
        $section.show();
        $oldSection = $section;

        $menu.find(">ul>li>a.active").removeClass("active");
        $menu.find(">ul>li>a." + menu).addClass("active");

        $subMenu.find(">ul").hide();
        $subMenu.find(">ul." + menu).show();

        if (submenu) {
            $section.find(">article").hide();
            $section.find(">article[id=" + fullPath + "]").show();
        } else {
            $section.find(">article").hide().eq(0).show();
        }

        $section.find("img.undecided").each(galleryImageLoaded);
    }

    function process() {
        $section.find(">article").each(function () {
            var id = $(this).attr("id");
            for (var i = 0; i < processors.length; i++) {
                if (processors[i].matches(id)) {
                    processors[i].process($(this));
                }
            }
        })
    }

    processors.push({
        matches: function (name) {
            return name == "about-team";
        },
        process: function ($article) {
            $article.find(">ul>li").each(function () {
                var $li = $(this);
                var img = $li.find("img.avatar").detach();
                $li.contents().wrapAll('<div class="float-container"><div class="float-container-right"><div class="float-container-table"><div class="float-container-cell"></div></div></div></div>');
                $li.find(".float-container").prepend('<div class="float-container-left"><div class="float-container-table"><div class="float-container-cell"><div class="avatar-round"></div></div></div></div>');
                $li.find("div.avatar-round").append(img);
            })
            $article.append('<div style="clear: both"></div>');
        }});

    processors.push({
        matches: function (name) {
            return name == "friends";
        },
        process: function ($article) {
            $article.find(">ul>li").each(function () {
                $(this).find("a>img.logo").wrap('<div class="curved-hz-1"><p></p></div>');
            })
        }});

    processors.push({
        matches: function (name) {
            return name.match(/gallery\-\w+/gi);
        },
        process: function ($article) {
            $article.find(">img").each(function () {
                var $img = $(this);
                $img.wrap('<div class="curved-hz-1"><div class="img">' +
                    '<a href="' + $img.attr('src') + '" rel="prettyPhoto[' + $article.attr('id') + ']" title="' + ($img.attr('alt') || '') + '"></a>' +
                    '</div></div>');
                $img.addClass("undecided").on("load", galleryImageLoaded);
            })
        }});

});
