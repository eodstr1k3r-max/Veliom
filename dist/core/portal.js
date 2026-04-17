let portalContainer = null;
export function setPortalContainer(container) {
    portalContainer = container;
}
export function createPortal(props) {
    const target = props.target || portalContainer || document.body;
    return {
        type: 'portal',
        props: {
            ...props,
            target,
        },
        children: props.children ? [props.children] : undefined,
    };
}
export function renderPortal(vnode, container) {
    container.innerHTML = '';
    if (vnode.children && vnode.children.length > 0) {
        const child = vnode.children[0];
        if (child.type === 'text') {
            container.appendChild(document.createTextNode(String(child.props.value)));
        }
        else if (child.type !== 'empty') {
            const element = document.createElement(child.type);
            for (const [key, value] of Object.entries(child.props)) {
                if (key !== 'children' && key !== 'key') {
                    if (key === 'className') {
                        element.setAttribute('class', String(value));
                    }
                    else if (key === 'style' && typeof value === 'object') {
                        Object.assign(element.style, value);
                    }
                    else if (value !== null && value !== undefined) {
                        element.setAttribute(key, String(value));
                    }
                }
            }
            if (child.children) {
                for (const grandChild of child.children) {
                    if (grandChild.type === 'text') {
                        element.appendChild(document.createTextNode(String(grandChild.props.value)));
                    }
                    else if (grandChild.type !== 'empty') {
                        const childEl = document.createElement(grandChild.type);
                        for (const [k, v] of Object.entries(grandChild.props)) {
                            if (k !== 'children' && k !== 'key' && v !== null && v !== undefined) {
                                if (k === 'className') {
                                    childEl.setAttribute('class', String(v));
                                }
                                else {
                                    childEl.setAttribute(k, String(v));
                                }
                            }
                        }
                        element.appendChild(childEl);
                    }
                }
            }
            container.appendChild(element);
        }
    }
}
