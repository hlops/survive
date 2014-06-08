$(function () {

    var DEFAULT_MENU = "about";

    var router;
    var $content, $menu, $subMenu, $subMenuSelection;
    var $oldSection, $section;
    var processors = [];

    var prettyPhotoSettings = {deeplinking: false,
        social_tools: '<div>' + VK.Share.button() + '</div>'}

    function galleryImageLoaded() {
        var $img = $(this);
        $img.removeAttr("width").removeAttr("height").css({ width: "", height: "" });
        if ($img.height() > 0 && $img.get(0).complete) {
            if ($img.width() / $img.height() > 25.6 / 19) {
                $img.addClass("wide");
            }
            $img.parents("div.curved-hz").addClass("curved-hz-1");
            $img.removeClass("undecided");
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
        menu.push('<div class="sub-menu"></div><img src="img/menu-selection.png" id="sub-menu-selection">');

        $("body>.viewPort>nav").append(menu.join(""));

        $content = $("body>.viewPort>div.content");
        $menu = $("body>.viewPort>nav>div.menu");
        $subMenu = $("body>.viewPort>nav>div.sub-menu");
        $subMenuSelection = $("#sub-menu-selection");

        router = new (Backbone.Router.extend({routes: {
            "*link": "menu"
        }}))();

        router.on('route:menu', function (arr) {
            arr = arr || DEFAULT_MENU;
            arr = arr.split("/");
            var anchor = arr[1];
            arr = arr[0].split("-");
            var link = arr[0], subMenuLink = arr[1];

            $section = $content.find(">section." + link);
            if (!$section.length) {
                $content.append("<section class='" + link + "'></section>");
                $section = $content.find(">section." + link);
                $section.load("partials/" + link + ".html article", function () {
                    var subMenu = ['<ul class="' + link + '">'], $item;
                    $section.find(">article").each(function () {
                        $item = $(this);
                        if ($item.attr("title")) {
                            subMenu.push('<li><i class=', $item.attr("id"), '></i><a href="#/' + $item.attr("id") + '" class="', $item.attr("id"), '">', $item.attr("title"), '</a></li>');
                        }
                    });
                    subMenu.push('</ul>');

                    $subMenu.append(subMenu.join(""));

                    // post process html
                    process();

                    toggleMenu(link, subMenuLink, anchor);
                });
            } else {
                toggleMenu(link, subMenuLink, anchor);
            }

            return false;
        });

        Backbone.history.start();
    });

    function toggleMenu(menu, submenu, anchor) {
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
        var $activeSubMenu = $subMenu.find(">ul." + menu).show();

        var $li = $activeSubMenu.find("a." + fullPath).parent();
        if ($li.length) {
            $("#sub-menu-selection").css({
                left: $li.position().left - ($li.index() ? 8 : 4),
                width: $li.width() + ($li.index() ? 12 : 8),
                display: "inline"
            });
        } else {
            $("#sub-menu-selection").hide();
        }

        if (submenu) {
            $section.find(">article").hide();
            $section.find(">article[id=" + fullPath + "]").show();
        } else {
            $section.find(">article").hide().eq(0).show();
        }

        $section.find("img.undecided").each(galleryImageLoaded);

        if (anchor) {
            document.getElementById(encodeURI(anchor)).scrollIntoView(true);
        }
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
                $li.contents().wrapAll('<div class="float-container"><div class="float-container-right"></div></div>');
                $li.find(".float-container").prepend('<div class="float-container-left"><div class="avatar-round"></div></div>');
                $li.find("div.avatar-round").append(img);
                $li.find("i").wrap("<div></div>");
            })
            $article.append('<div style="clear: both"></div>');
        }});

    processors.push({
        matches: function (name) {
            return name == "friends";
        },
        process: function ($article) {
            $article.find(">ul>li").each(function () {
                var $img = $(this).find("a>img.logo");
                $img.parent().attr("target", "friends");
                $img.wrap('<div class="curved-hz curved-hz-1 curved-hz-2"><p></p></div>');
            })
        }});

    processors.push({
        matches: function (name) {
            return name.match(/gallery\-\w+/gi);
        },
        process: function ($article) {
            $article.find(">img").each(function () {
                var $img = $(this);
                $img.wrap('<div class="curved-hz"><div class="img">' +
                    '<a href="' + removeThumbSuffix($img.attr('src')) + '" rel="prettyPhoto[' + $article.attr('id') + ']" title="' + ($img.attr('alt') || '') + '"></a>' +
                    '</div></div>');
                $img.addClass("undecided").on("load", galleryImageLoaded);
            })
            $article.find("a[rel^=prettyPhoto]").prettyPhoto(prettyPhotoSettings);
        }});

    processors.push({
        matches: function (name) {
            return true;
        },
        process: function ($article) {
            $article.find("i.email").each(function () {
                var $i = $(this);
                $i.contents().wrap('<a href="mailto:' + $i.text() + '"></a>');
            });
            $article.find("i.vkontakte").each(function () {
                var $i = $(this);
                $i.contents().wrap('<a href="' + $i.text() + '" target="vk"></a>');
            });
        }
    })

    function removeThumbSuffix(s) {
        return s.replace(/_small\.(\w{3,4})/i, ".$1");
    }
});
