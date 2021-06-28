/*
 * 游戏逻辑
 */
import { EventManager, EventName } from '../manager/EventManager'
const { ccclass, property } = cc._decorator;
enum Direction { LEFT, RIGHT, UP, DOWN, }
enum GameState { NONE, PLAYING, PAUSE, GAME_OVER, }

@ccclass
export default class GameLayout extends cc.Component {
    @property(cc.Prefab)
    snake_prefab: cc.Prefab = null;
    @property(cc.Prefab)
    food_prefab: cc.Prefab = null;

    private row: number = 0;
    private col: number = 0;
    private cell: number = 40;
    private snake_node_list:cc.Node[] = [];
    private food_node_list:cc.Node[] = [];
    private move_speed: number = 0;
    private move_duration: number = 0;
    private direction:Direction = Direction.RIGHT;
    private game_state: GameState = GameState.NONE;
    private food_speed: number = 0;
    private food_duration: number = 0;

    onLoad () {
	let width = this.node.width;
	let height = this.node.height;
	width -= width%this.cell;
	height -= height%this.cell;
	this.row = height/this.cell;
	this.col = width/this.cell;
	this.node.setContentSize(width, height);
	//cc.log(`行:${this.row},列:${this.col}`);

	EventManager.listen(EventName.NEW_GAME, "newGame", this);
	EventManager.listen(EventName.PAUSE_GAME, "pauseGame", this);
	EventManager.listen(EventName.START_GAME, "startGame", this);
    }

    onDestroy () {
	EventManager.remove(EventName.NEW_GAME, "newGame", this);
	EventManager.remove(EventName.PAUSE_GAME, "pauseGame", this);
	EventManager.remove(EventName.START_GAME, "startGame", this);
    }

    start () {
	cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
	this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd.bind(this));
	this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd.bind(this));
    }

    touchEnd (event:cc.Event.EventTouch) {
	let start_pos = event.touch.getStartLocation();
	let end_pos = event.touch.getLocation();
	let offx = start_pos.x-end_pos.x;
	let offy = start_pos.y-end_pos.y;
	if (Math.abs(offx) > Math.abs(offy) && Math.abs(offx) > 50) {
	    if (offx < 0) {
		this.direction = Direction.RIGHT;
		this.move(this.direction)
		this.move_duration = 0;
	    }
	    else {
		this.direction = Direction.LEFT;
		this.move(this.direction)
		this.move_duration = 0;
	    }
	}
	else if (Math.abs(offx) < Math.abs(offy) && Math.abs(offy) > 50) {
	    if (offy > 0) {
		this.direction = Direction.DOWN;
		this.move(this.direction)
		this.move_duration = 0;
	    }
	    else {
		this.direction = Direction.UP;
		this.move(this.direction)
		this.move_duration = 0;
	    }
	}
    }

    /**
     * 开始新游戏
     */
    newGame () {
	this.game_state = GameState.PLAYING;
	this.direction = Direction.RIGHT;
	this.move_speed = 0.5;
	this.food_speed = 3;
	this.node.destroyAllChildren();
	this.snake_node_list = [];
	this.food_node_list = [];
	let node = cc.instantiate(this.snake_prefab);
	node.parent = this.node;
	let pos = this.coordinateToPosition(0, this.row-1);
	node.setPosition(pos);
	this.snake_node_list.push(node);
	this.dumpFood();
    }

    /**
     * 暂停游戏
     */
    pauseGame () {
	this.game_state = GameState.PAUSE;
    }

    /**
     * 开始游戏
     */
    startGame () {
	this.game_state = GameState.PLAYING;
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
	if (this.game_state == GameState.PLAYING) {
	    if (event.keyCode == cc.macro.KEY.left) {
		this.direction = Direction.LEFT;
	    }
	    else if (event.keyCode == cc.macro.KEY.right) {
		this.direction = Direction.RIGHT;
	    }
	    else if (event.keyCode == cc.macro.KEY.up) {
		this.direction = Direction.UP;
	    }
	    else if (event.keyCode == cc.macro.KEY.down) {
		this.direction = Direction.DOWN;
	    }
	    this.move(this.direction);
	    this.move_duration = 0;
	}
    }

    /**
     * 坐标转化位置
     */
    private coordinateToPosition (x:number, y:number) : cc.Vec2 {
	if (x >= 0 && x < this.col && y >= 0 && y < this.row) {
	    return cc.v2((x+0.5)*this.cell-this.node.width/2, (y+0.5)*this.cell-this.node.height/2);
	}
	else {
	    return null;
	}
    }

    private positionToCoordinate (pos:cc.Vec2) : cc.Vec2 {
	return cc.v2(
	    (pos.x+this.node.width/2)/this.cell-0.5,
	    (pos.y+this.node.height/2)/this.cell-0.5
	);
    }

    private move (direction:Direction) {
	if (this.snake_node_list.length == 0) { return; }
	let pos:cc.Vec2 = this.positionToCoordinate(this.snake_node_list[0].getPosition());
	if (direction == Direction.LEFT) {
	    pos = cc.v2(pos.x-1, pos.y);
	}
	else if (direction == Direction.RIGHT) {
	    pos = cc.v2(pos.x+1, pos.y);
	}
	else if (direction == Direction.UP) {
	    pos = cc.v2(pos.x, pos.y+1);
	}
	else if (direction == Direction.DOWN) {
	    pos = cc.v2(pos.x, pos.y-1);
	}
	pos = this.coordinateToPosition(pos.x, pos.y);
	if (pos) {
	    let eat_food = false;
	    for (let i = 0; i < this.food_node_list.length && !eat_food; ++i) {
		let food_node = this.food_node_list[i];
		if (food_node.x == pos.x && food_node.y == pos.y) {
		    eat_food = true;
		    this.food_node_list.splice(i, 1);
		    food_node.destroy();
		}
	    }

	    let last_snake_position = this.snake_node_list[this.snake_node_list.length-1].getPosition();
	    for (let i = this.snake_node_list.length-1; i > 0; --i) {
		this.snake_node_list[i].setPosition(this.snake_node_list[i-1].getPosition());
	    }
	    this.snake_node_list[0].setPosition(pos);

	    if (eat_food) {
		let snake_node = cc.instantiate(this.snake_prefab);
		snake_node.parent = this.node;
		snake_node.setPosition(last_snake_position);
		this.snake_node_list.push(snake_node);
		EventManager.dispatch(EventName.EAT_FOOD);
		this.dumpFood();
	    }

	    let snake_head = this.snake_node_list[0];
	    for (let i = 1; i < this.snake_node_list.length; ++i) {
		let snake_node = this.snake_node_list[i];
		if (snake_node.x == snake_head.x && snake_node.y == snake_head.y) {
		    this.gameOver();
		    break;
		}
	    }
	}
	else {
	    this.gameOver();
	}
    }

    /**
     * 游戏结束
     */
    private gameOver () {
	this.game_state = GameState.GAME_OVER;
	EventManager.dispatch(EventName.OVER_GAME);
    }

    /**
     * 生产食物
     */
    private dumpFood () {
	let list:number[] = [];
	let snake_list:number[] = [];
	for (let node of this.snake_node_list) {
	    let coordinate:cc.Vec2 = this.positionToCoordinate(node.getPosition());
	    snake_list.push(coordinate.x+coordinate.y*this.col);
	}
	for (let i = 0; i < this.col*this.row; ++i) {
	    if (snake_list.indexOf(i) == -1) {
		list.push(i);
	    }
	}
	if (list.length > 0) {
	    let choose = list[Math.floor(Math.random()*list.length)];
	    let x = choose%this.col;
	    let y = (choose-x)/this.col;
	    let node = cc.instantiate(this.food_prefab);
	    node.parent = this.node;
	    node.setPosition(this.coordinateToPosition(x, y));
	    this.food_node_list.push(node);
	}
    }

    update (dt) {
	if (this.game_state == GameState.PLAYING) {
	    this.move_duration += dt;
	    if (this.move_duration >= this.move_speed) {
		this.move_duration -= this.move_speed;
		this.move(this.direction);
	    }
	    // this.food_duration += dt;
	    // if (this.food_duration >= this.food_speed) {
	    //     this.food_duration -= this.food_speed;
	    //     this.dumpFood();
	    // }
	}
    }
}
