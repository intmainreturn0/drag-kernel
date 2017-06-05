var initers = {
    e_dragrelative: function( $e ) {
        $e.find( '.drag' ).drag( function( e, dd ) {
            if( !this.getAttribute( 'data-vert' ) )
                $( this ).offset( { left: dd.offsetX } )
            if( !this.getAttribute( 'data-horz' ) )
                $( this ).offset( { top: dd.offsetY } )
        } )
    },

    e_counters: function( $e ) {
        $e.find( '.counter' )
            .on( 'dragstart', function( e, dd ) {
                dd.startVal = +$( this ).addClass( 'active' ).text()
                dd.propDir  = $( this ).hasClass( 'horz' ) ? 'dx' : 'dy'
            } )
            .drag( function( e, dd ) {
                $( this ).text( dd.startVal + Math.round( dd[dd.propDir] / 10 ) )
            } )
            .on( 'dragend', function() {
                $( this ).removeClass( 'active' )
            } )
    },

    e_containment: function( $e ) {
        $e.find( '.drag' )
            .on( "dragstart", function( e, dd ) {    // вызывается каждый раз при начале таскания => если DOM изменится, и offset контейнера поменяется, он пересчитается
                var $container  = $e.find( '.reorderable' )
                dd.limit        = $container.offset();
                dd.limit.bottom = dd.limit.top + $container.outerHeight() - $( this ).outerHeight();
                dd.limit.right  = dd.limit.left + $container.outerWidth() - $( this ).outerWidth();
            } )
            .drag( function( e, dd ) {
                $( this ).offset( {
                    top:  Math.min( dd.limit.bottom, Math.max( dd.limit.top, dd.offsetY ) ),
                    left: Math.min( dd.limit.right, Math.max( dd.limit.left, dd.offsetX ) )
                } );
            } );
    },

    e_slider: function( $e ) {
        $e.find( '.drag' )
            .on( 'dragstart', function( e, dd ) {
                dd.minX = $e.find( '.slider' ).offset().left
                dd.maxX = dd.minX + $e.find( '.slider' ).width() - 30 // relative координаты
            } )
            .drag( function( e, dd ) {
                $( this ).offset( { left: Math.max( dd.minX, Math.min( dd.maxX, dd.offsetX ) ) } )
            } )
    },

    e_incircle: function( $e ) {
        var $in = $e.find( '.reorderable' ), $drag = $e.find( '.drag' ), r = $drag.outerWidth() / 2, R = $in.outerWidth() / 2
        $in
            .on( 'dragstart', function( e, dd ) {
                dd.centerX = dd.originalX + R
                dd.centerY = dd.originalY + R
            } )
            .drag( function( e, dd ) {
                var dx = e.pageX - dd.centerX, dy = e.pageY - dd.centerY, len = Math.sqrt( dx * dx + dy * dy )
                $drag.offset( { left: dd.centerX + dx / len * ( R - r ) - r, top: dd.centerY + dy / len * ( R - r ) - r } )
            }, { distance: -1 } )
    },

    e_grid: function( $e ) {
        $e.find( '.drag' ).drag( function( e, dd ) {
            $( this ).css( { top: Math.round( dd.offsetY / 25 ) * 25, left: Math.round( dd.offsetX / 25 ) * 25 } );
        } );
    },

    e_sin: function( $e ) {
        var orig_off = $e.find( '.drag' ).drag( function( e, dd ) {
            $( this ).css( { top: orig_off.top + 50 * Math.sin( ( dd.offsetX - orig_off.left ) / 60 ), left: dd.offsetX } )
        } ).offset()
    },

    e_handle_top: function( $e ) {
        $e.find( '.drag' ).drag( function( e, dd ) {
            $( this ).offset( { top: dd.offsetY, left: dd.offsetX } )
        }, { handle: ".handle" } );
    },

    e_proxy: function( $e ) {
        $e.find( '.drag' )
            .on( "dragstart", function() {
                return $( this ).clone().addClass( 'proxy' ).appendTo( document.body );
            } )
            .drag( function( e, dd ) {
                $( dd.proxy ).offset( { top: dd.offsetY, left: dd.offsetX } )
            } )
            .on( "dragend", function( e, dd ) {
                $( this ).animate( { top: dd.offsetY, left: dd.offsetX } ).animate( { top: dd.originalY, left: dd.originalX } );
                $( dd.proxy ).remove();
            } );
    },

    e_resize: function( $e ) {
        $e.find( '.drag' )
            .on( "dragstart", function( e, dd ) {
                dd.width  = $( this ).width();
                dd.height = $( this ).height();
            } )
            .drag( function( e, dd ) {
                $( this ).css( { width: Math.max( 20, dd.width + dd.dx ), height: Math.max( 20, dd.height + dd.dy ) } );
            }, { handle: '.resizer' } );
    },

    e_multi: function( $e ) {
        $e.find( '.drag' ).off( 'click' )
            .click( function() { $( this ).toggleClass( 'selected' ) } )
            .on( "draginit", function() {
                if( $( this ).is( '.selected' ) ) // если тащим за выделенный - возвращаем, что таскать нужно все
                    return $( '.selected' );
            } )
            .drag( function( e, dd ) {    // тут offsetY у каждого свой, то есть даже когда тащим за другой - вызывается обработчик для каждого с его параметрами
                $( this ).css( { top: dd.offsetY, left: dd.offsetX } );
            } )
    },

    e_multi_proxy: function( $e ) {
        $e.find( '.drag' ).off( 'click' )
            .click( function() { $( this ).toggleClass( 'selected' ) } )
            .on( "draginit", function() {
                if( $( this ).is( '.selected' ) ) // кстати, если выделить несколько здесь и в прошлом example, они будут двигаться совместно (только эти с проксями)
                    return $( '.selected' );
            } )
            .on( "dragstart", function() {    // возникает для каждого элемента, который выделен
                return $( this ).clone().addClass( 'proxy' ).appendTo( document.body );
            } )
            .drag( function( e, dd ) {
                $( dd.proxy ).offset( { top: dd.offsetY, left: dd.offsetX } )
            } )
            .on( "dragend", function( e, dd ) {  // аналогично, возникает для каждого
                $( this ).css( { top: dd.originalY, left: dd.originalX } )      // что-то без этого webkit проглючивает первый раз
                $( this ).animate( { top: dd.offsetY, left: dd.offsetX }, function() { $( dd.proxy ).remove(); } )
            } );
    },

    e_orderable: function( $e ) {
        $e.find( '.orderable' ).orderable()
    },

    e_orderable_heights: function( $e ) {
        $e.find( '.orderable' ).orderable( { evenOdd: true } )
    },

    e_orderable_both: function( $e ) {
        $e.find( '.orderable-both' ).orderable()
    },

};

window.demoEntry = function() {
    $( '.drag' ).click( function() {
        var $div = $( '<div class="click-alert">onclick</div>' ).appendTo( 'body' )
        setTimeout( function() {
            $div.remove()
        }, 1000 )
    } )

    $( '.example' ).each( function() {
        this.id && initers[this.id] && initers[this.id]( $( this ) )
    } )
} 
    