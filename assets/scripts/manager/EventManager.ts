/*
 * 事件系统 
 */


interface IEvent {
    name: EventName;
    fn: string;
    target: cc.Component;
};


class EventManager {
    private static event_list:Map<EventName, IEvent[]> = new Map();
    
    /**
     * 监听事件
     * param event_name 事件名
     * param function_name 触发的函数名
     * param target 触发的函数绑定的脚本
     */
    public static listen (event_name:EventName, function_name:string, target:cc.Component) {
	cc.log(`EventManager listen ${event_name} ${target}->${function_name}`);
	let list:IEvent[] = EventManager.event_list.get(event_name);
	let event:IEvent = {
	    name: event_name,
	    fn: function_name,
	    target: target,
	};
	if (list) {
	    list.push(event);
	}
	else {
	    list = [event];
	    EventManager.event_list.set(event_name, list);
	}
    }

    /**
     * 触发事件
     * param event_name 事件名
     * param data 传递的数据
     */
    public static dispatch (event_name:EventName, data?:any) {
	let list = EventManager.event_list.get(event_name);
	if (list && list.length > 0) {
	    for (let event of list) {
		cc.log(`EventManager dispatch ${event.name} ${event.target}->${event.fn}:${data}`);
		event.target[event.fn].call(event.target, data);
	    }
	}
    }

    /**
     * 删除事件
     * param event_name 事件名
     * param function_name 触发的函数名
     * param target 绑定的脚本
     */
    public static remove (event_name:EventName, function_name:string, target:cc.Component) {
	let list = EventManager.event_list.get(event_name);
	if (list && list.length > 0) {
	    let i:number;
	    let event:IEvent;
	    for (i = 0; i < list.length; ++i) {
		event = list[i];
		if (event.target == target && event.fn == function_name) {
		    list.splice(i, 1);
		    break;
		}
	    }
	    if (i == list.length) {
		cc.error(`EventManager remove ${event_name} ${target} failed`);
	    }
	}
	else {
	    cc.error(`EventManager remove ${event_name} ${target} failed`);
	}
    }
}

/**
 * 事件名称
 */
enum EventName {
    NEW_GAME, PAUSE_GAME, START_GAME, OVER_GAME,
    EAT_FOOD,
};

export { EventManager, EventName }
