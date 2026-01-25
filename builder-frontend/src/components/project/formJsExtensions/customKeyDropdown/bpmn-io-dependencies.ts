/**
 * WARNING: This Code is rewritten from https://github.com/bpmn-io/properties-panel
 * 
 * Due to an oddity with using contexts from compiled libraries,
 * SelectEntry and its context-using dependencies need to be
 * rewritten here in order for customKeyDropdownProvider.ts to function properly.
 * 
 * Specific files used here:
 * - https://github.com/bpmn-io/properties-panel/blob/main/src/components/entries/Select.js
 * - https://github.com/bpmn-io/properties-panel/blob/main/src/hooks/useError.js
 * - https://github.com/bpmn-io/properties-panel/blob/main/src/hooks/useEvent.js
 * - https://github.com/bpmn-io/properties-panel/blob/main/src/hooks/useShowEntryEvent.js
 */

import classNames from 'classnames';
import { isFunction } from 'min-dash';

import { html } from 'htm/preact';
import {
  useCallback, useContext, useEffect, useRef, useState
} from 'preact/hooks';

import {
  useEvent, ErrorsContext, EventContext, PropertiesPanelContext
} from '@bpmn-io/properties-panel';

export function useEvent(event, callback, eventBus) {
  const eventContext = useContext(EventContext);

  if (!eventBus) {
    ({ eventBus } = eventContext);
  }

  const didMount = useRef(false);

  // (1) subscribe immediately
  if (eventBus && !didMount.current) {
    eventBus.on(event, callback);
  }

  // (2) update subscription after inputs changed
  useEffect(() => {
    if (eventBus && didMount.current) {
      eventBus.on(event, callback);
    }

    didMount.current = true;

    return () => {
      if (eventBus) {
        eventBus.off(event, callback);
      }
    };
  }, [ callback, event, eventBus ]);
}

/**
 * Subscribe to `propertiesPanel.showEntry`.
 *
 * @param {string} id
 *
 * @returns {import('preact').Ref}
 */
export function useShowEntryEvent(id) {
  const { onShow } = useContext(PropertiesPanelContext);

  const ref = useRef();

  const focus = useRef(false);

  const onShowEntry = useCallback((event) => {
    if (event.id === id) {
      onShow();

      if (!focus.current) {
        focus.current = true;
      }
    }
  }, [ id ]);

  useEffect(() => {
    if (focus.current && ref.current) {
      if (isFunction(ref.current.focus)) {
        ref.current.focus();
      }

      if (isFunction(ref.current.select)) {
        ref.current.select();
      }

      focus.current = false;
    }
  });

  useEvent('propertiesPanel.showEntry', onShowEntry);

  return ref;
}

export function useError(id) {
  const { errors } = useContext(ErrorsContext);

  return errors[ id ];
}

{ /* Required to break up imports, see https://github.com/babel/babel/issues/15156 */ }

/**
 * @typedef { { value: string, label: string, disabled: boolean, children: { value: string, label: string, disabled: boolean } } } Option
 */

/**
 * Provides basic select input.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string[]} props.path
 * @param {string} props.label
 * @param {Function} props.onChange
 * @param {Function} props.onFocus
 * @param {Function} props.onBlur
 * @param {Array<Option>} [props.options]
 * @param {string} props.value
 * @param {boolean} [props.disabled]
 */
function Select(props) {
  const {
    id,
    label,
    onChange,
    options = [],
    value = '',
    disabled,
    onFocus,
    onBlur,
  } = props;

  const ref = useShowEntryEvent(id);

  const [ localValue, setLocalValue ] = useState(value);

  const handleChangeCallback = ({ target }) => {
    onChange(target.value);
  };

  const handleChange = e => {
    handleChangeCallback(e);
    setLocalValue(e.target.value);
  };

  useEffect(() => {
    if (value === localValue) {
      return;
    }

    setLocalValue(value);
  }, [ value ]);

  return (html`
    <div class="bio-properties-panel-select">
      <label for=${ prefixId(id) } class="bio-properties-panel-label">
        ${label}
      </label>
      <select
        ref=${ ref }
        id=${ prefixId(id) }
        name=${ id }
        class="bio-properties-panel-input"
        onInput=${ handleChange }
        onFocus=${ onFocus }
        onBlur=${ onBlur }
        value=${ localValue }
        disabled=${ disabled }
      >
        ${options.map((option, idx) => {
          if (option.children) {
            return (html`
              <optgroup key=${ idx } label=${ option.label }>
                ${option.children.map((child, idx) => (html`
                  <option
                    key=${ idx }
                    value=${ child.value }
                    disabled=${ child.disabled }
                  >
                    ${child.label}
                  </option>`
                ))}
              </optgroup>`
            );
          }

          return (html`
            <option key=${ idx } value=${ option.value } disabled=${ option.disabled }>
              ${option.label}
            </option>`
          );
        })}
      </select>
    </div>`
  );
}

/**
 * @param {object} props
 * @param {object} props.element
 * @param {string} props.id
 * @param {string} [props.description]
 * @param {string} props.label
 * @param {Function} props.getValue
 * @param {Function} props.setValue
 * @param {Function} props.onFocus
 * @param {Function} props.onBlur
 * @param {Function} props.getOptions
 * @param {boolean} [props.disabled]
 * @param {Function} [props.validate]
 * @param {string|import('preact').Component} props.tooltip
 */
export default function SelectEntry(props) {
  const {
    element,
    id,
    description,
    label,
    getValue,
    setValue,
    getOptions,
    disabled,
    onFocus,
    onBlur,
    validate,
    tooltip
  } = props;

  const options = getOptions(element);

  const globalError = useError(id);

  const [ localError, setLocalError ] = useState(null);

  let value = getValue(element);

  useEffect(() => {
    if (isFunction(validate)) {
      const newValidationError = validate(value) || null;

      setLocalError(newValidationError);
    }
  }, [ value, validate ]);


  const onChange = (newValue) => {
    let newValidationError = null;

    if (isFunction(validate)) {
      newValidationError = validate(newValue) || null;
    }

    setValue(newValue, newValidationError);
    setLocalError(newValidationError);
  };

  const error = globalError || localError;

  return (html`
    <div
      class=${ classNames(
        'bio-properties-panel-entry',
        error ? 'has-error' : '')
      }
      data-entry-id=${ id }>
      <${Select}
        id=${ id }
        key=${ element }
        label=${ label }
        value=${ value }
        onChange=${ onChange }
        onFocus=${ onFocus }
        onBlur=${ onBlur }
        options=${ options }
        disabled=${ disabled }
        element=${ element } />
      ${ error && html`<div class="bio-properties-panel-error">${ error }</div>` }
    </div>`
  );
}

export function isEdited(node) {
  return node && !!node.value;
}

// helpers /////////////////

function prefixId(id) {
  return `bio-properties-panel-${ id }`;
}
