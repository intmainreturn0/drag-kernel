# Реализация drag-паттерна

Думаю, каждый web-разработчик пробовал делать свою реализацию dragdrop: чтоб можно было таскать элементы мышкой,
описывать правила/ограничения т.п.
Каждый сталкивался с тем, что нужно suppress'ить событие click, реагировать на touch-события, таскать копии элементов,
отменять действия по условиям и т.п.

В демке и коде — моя реализация этого паттерна. В этой демке она облегченная: есть полноценный dragdrop, а тут только drag.

Акцент при написании — не делать громоздкое ядро с кучей настроечных параметров, а наоборот: сделать минимальное ядро,
и уже вызывающая сторона решает, как его использовать.

[Демо](https://intmainreturn0.github.io/drag-kernel/)
