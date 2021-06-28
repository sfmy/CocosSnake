/*
 * 菜单
 */

import { EventManager, EventName } from '../manager/EventManager'
const { ccclass, property } = cc._decorator;

@ccclass
export default class MenuLayout extends cc.Component {
    @property(cc.Label)
    pause_label: cc.Label = null;
    @property(cc.Button)
    pause_button: cc.Button = null;
    @property(cc.Label)
    score_label: cc.Label = null;
    @property(cc.Label)
    best_score_label: cc.Label = null;

    private best_score:number = 0;
    private score:number = 0;

    onLoad () {
	EventManager.listen(EventName.OVER_GAME, "gameOver", this);
	EventManager.listen(EventName.EAT_FOOD, "eatFood", this);
	this.best_score = cc.sys.localStorage.getItem("best_score") || 0;
	this.best_score_label.string = this.scoreToString(this.best_score);
    }

    onDestroy () {
	EventManager.remove(EventName.OVER_GAME, "gameOver", this);
	EventManager.remove(EventName.EAT_FOOD, "eatFood", this);
    }

    gameOver () {
	this.pause_button.interactable = false;
    }

    eatFood () {
	++ this.score;
	this.score_label.string = this.scoreToString(this.score);
	if (this.score > this.best_score) {
	    this.best_score = this.score;
	    cc.sys.localStorage.setItem("best_score", this.best_score);
	    this.best_score_label.string = this.scoreToString(this.best_score);
	}
    }

    onNewGameClick () {
	EventManager.dispatch(EventName.NEW_GAME);
	this.pause_button.interactable = true;
	this.score = 0;
	this.score_label.string = this.scoreToString(this.score);
    }

    onPauseClick () {
	if (this.pause_label.string == '暂停游戏') {
	    EventManager.dispatch(EventName.PAUSE_GAME);
	    this.pause_label.string = '继续游戏';
	}
	else {
	    EventManager.dispatch(EventName.START_GAME);
	    this.pause_label.string = '暂停游戏';
	}
    }

    private scoreToString (score:number) : string {
	if (score < 10) {
	    return '000'+score;
	}
	else if (score < 100) {
	    return '00'+score;
	}
	else if (score < 1000) {
	    return '0'+score;
	}
	else {
	    return ''+score;
	}
    }
}
