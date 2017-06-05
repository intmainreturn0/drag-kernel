function Orderable( elem, ops ) {
    var $elem               = $( elem ),
        class_elem_dragging = 'orderable_sorting',
        class_dragging      = 'orderable_dragging',
        even_odd            = ops.evenOdd, // контролы
        anim_obj            = {}, rows, $drag, drag_index, dir_wh, dir_min_pos, dir_max_pos, old_drag_dir, // для таскания
        direction           = $elem.data( 'dir' ) || 'v', // направление таскания: по умолчанию v (vertical) может быть также h (horizontal) и b (both)
        vert                = direction === 'v',
        dir_prop_lt         = vert ? 'top' : 'left',
        dir_prop_wh         = vert ? 'h' : 'w',
        dir_prop_WH         = vert ? 'Height' : 'Width' // переменные для направления при direction = [v|h]

    function dragInit( e, dd ) {    // также на draginit может быть навешан внешний обработчик, возвращающий false
        return !$elem.hasClass( class_elem_dragging ) && ($drag =
                e.target === elem ? [] : e.target.parentNode === elem ? $( e.target ) :
                    $( e.target ).parentsUntil( elem ).last()).length > (old_drag_dir = 0)
    }

    function dragStart( e, dd ) {   // drag привязывается к $elem, и dragStart вызывается для него, а что за ряд таскают - это можно выяснить по e.target
        rows = []
        for( var off, elem = $elem.addClass( class_elem_dragging )[0].firstChild; elem; elem = elem.nextSibling )        // children(':not(.nodrag):visible')
            if( elem.offsetWidth > 0 && !elem.classList.contains( 'nodrag' ) ) {
                elem === $drag[0] && ( drag_index = rows.length ) // rows[drag_index].e == $drag[0]
                off = $( elem ).offset()
                rows.push( { e: elem, h: elem.offsetHeight, w: elem.offsetWidth, left: off.left, top: off.top, m: 0 } )
            }
        // эти переменные нужны только для таскания по одному направлению (direction=[v|h])
        dir_wh      = $drag.addClass( class_dragging )['outer' + dir_prop_WH]( true )
        dir_min_pos = $( rows[0].e ).offset()[dir_prop_lt] - $drag['offset']()[dir_prop_lt]  // // min/max ограничения на relative координаты при таскании $drag
        dir_max_pos = $( rows[rows.length - 1].e ).offset()[dir_prop_lt] - $drag.offset()[dir_prop_lt] +
            $( rows[rows.length - 1].e )['outer' + dir_prop_WH]( true ) - dir_wh
        $( '<div class="hover_block" style="cursor: move">' ).appendTo( 'body' )    // он перехватывает курсор, чтоб в css hover-эффекты не срабатывали
        $elem.triggerHandler( 'orderStart', [$drag] )
        return $drag    // это proxy; нужно его возвратить, чтоб document проскролливался в зависимости от положения именно этого ряда
    }

    function dragDirection( e, dd ) {   // direction = [v|h] (в этом случае vert (true/false) имеет значение, используются переменные dir_*)
        var drag_dir = $drag.css( dir_prop_lt, Math.max( dir_min_pos, Math.min( dir_max_pos, vert ? dd.dy : dd.dx ) ) ).offset()[dir_prop_lt],
            rel_d    = old_drag_dir - drag_dir
        for( var i = rel_d ? 0 : 1e9; i < rows.length; ++i )
            if( i !== drag_index ) {    // нужно обработать все кроме $drag
                var row = rows[i], is_dom_before = i < drag_index,  // находится ли rows[i].e в DOM перед $drag
                    cur_row_t                    = row[dir_prop_lt] + ( row.m ? is_dom_before ? dir_wh : -dir_wh : 0 ),   // offsetTop на время окончания анимации (!=$(row.e).offset().dir_prop_lt, так как во время анимации он меняется)
                    is_visual_before             = rel_d > 0 ? drag_dir > cur_row_t + row[dir_prop_wh] / 2 : drag_dir + dir_wh > cur_row_t + row[dir_prop_wh] / 2,    // находится ли rows[i].e перед $drag визуально
                    needs_move                   = is_dom_before != is_visual_before  // нужно ли rows[i] смещать (вверх или вниз - зависит от is_dom_before)
                if( row.m != needs_move ) {
                    row.m                 = needs_move
                    anim_obj[dir_prop_lt] = needs_move ? is_dom_before ? dir_wh : -dir_wh : 0    // не создашь через { ...:... } нотацию, так как имя динамическое
                    $( row.e ).stop().animate( anim_obj, 200 )
                    even_odd && row.e.classList.toggle( 'odd' )
                }
            }
        old_drag_dir = drag_dir
    }

    function dragBoth( e, dd ) {    // direction=b; таскать можно $drag по экрану где угодно, местами меняются, когда наведешь мышку (середину drag) на какой-то другой элемент
        var drag_off  = $drag.css( { top: dd.dy, left: dd.dx } ).offset(),
            drag_cx   = drag_off.left + $drag[0].offsetWidth / 2,
            drag_cy   = drag_off.top + $drag[0].offsetHeight / 2,
            ins_index = -1
        for( var i = 0; ( row = rows[i] ) && ins_index < 0; ++i )
            if( drag_cx >= row.left && drag_cx <= row.left + row.w && drag_cy >= row.top && drag_cy <= row.top + row.h )
                ins_index = i;
        for( i = ins_index >= 0 ? 0 : 1e9; i < rows.length; ++i )
            if( i !== drag_index ) {
                var row        = rows[i],
                    needs_move = i < ins_index && i < drag_index || i > ins_index && i > drag_index ? 0 : ins_index > drag_index && i <= ins_index ? -1 : 1
                if( row.m != needs_move ) {
                    row.m         = needs_move
                    anim_obj.top  = needs_move > 0 ? rows[i + 1].top - row.top : needs_move < 0 ? rows[i - 1].top - row.top : 0
                    anim_obj.left = needs_move > 0 ? rows[i + 1].left - row.left : needs_move < 0 ? rows[i - 1].left - row.left : 0
                    $( row.e ).stop().animate( anim_obj, 200 )
                }
            }
    }

    function dragEnd( e, dd ) {
        // ищем, куда нужно вставить $drag
        var insert_index, insertPos = 'Before', undefined, drag_off = $drag.offset()
        for( var i = 0; i < rows.length && insert_index === undefined; ++i )
            if( rows[i].m ) // ниже - очень хитрый и короткий алгоритм, одинаковый как для вертикального, так и для горизонтального, так и для произвольного таскания
                if( i < drag_index )
                    insert_index = i
                else
                    for( insert_index = i, insertPos = 'After'; rows[insert_index + 1] && rows[insert_index + 1].m; ++insert_index ) {}
        if( insert_index !== undefined && insert_index !== drag_index ) {
            $drag['insert' + insertPos]( rows[insert_index].e );
            even_odd && ( drag_index - insert_index & 1 ) && $drag.toggleClass( 'odd' ) // если переместили на нечетное число рядов (сами ряды меняли odd во время перемещения)
            $elem.triggerHandler( 'change' )
        }

        // отменяем все визуальные эффекты: все позиционируется по местам, только таскаемый визуально остается
        $elem.children().stop().css( { top: '', left: '' } )
        $drag.offset( drag_off )

        // потому что он плавно доезжает до нужного места, причем с одинаковой скоростью, то есть время анимации зависит от расстояния
        var dist = Math.sqrt( Math.pow( parseInt( $drag.css( 'left' ) ), 2 ) + Math.pow( parseInt( $drag.css( 'top' ) ), 2 ) )
        $drag.animate( { left: 0, top: 0 }, Math.min( 400, dist * 5 ), function() {
            $drag.removeClass( class_dragging ) // убираем визуальный эффект таскания только после того как он доехал до места
            $elem.removeClass( class_elem_dragging ).triggerHandler( 'orderEnd', [$drag] )
            rows = $drag = drag_index = null   // чистим память от ссылок на DOM
        } )
        $( '.hover_block' ).remove()
    }

    $elem.drag( direction == 'b' ? dragBoth : dragDirection, ops ).on( 'draginit', dragInit ).on( 'dragstart', dragStart ).on( 'dragend', dragEnd )
}

$.fn.orderable = function( ops ) {
    ops = $.extend( { scroll: document, distance: 5 }, ops )    // сюда можно посылать как drag ops, так и надстройки специфично для orderable
    return this.each( function() {
        !$.data( this, 'orderable' ) && $.data( this, 'orderable', new Orderable( this, ops ) )
    } )
}