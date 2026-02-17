'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import styles from './input.module.css';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    large?: boolean;
    wrapperClassName?: string;
    floating?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, large, className, wrapperClassName, floating = false, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const hasValue = !!props.value || !!props.defaultValue;
        const isFloating = floating && label;

        return (
            <div className={cn(styles.wrapper, error && styles.error, wrapperClassName)}>
                {label && !isFloating && <label className={styles.label}>{label}</label>}
                <div className={cn(styles.inputContainer, isFloating && styles.floatingContainer)}>
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        className={cn(
                            styles.input,
                            large && styles.inputLarge,
                            leftIcon ? styles.hasLeftIcon : undefined,
                            rightIcon ? styles.hasRightIcon : undefined,
                            isFloating ? styles.floatingInput : undefined,
                            isFloating && (focused || hasValue) ? styles.floatingInputActive : undefined,
                            className
                        )}
                        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                        placeholder={isFloating ? ' ' : props.placeholder}
                        {...props}
                    />
                    {isFloating && (
                        <label
                            className={cn(
                                styles.floatingLabel,
                                (focused || hasValue) ? styles.floatingLabelActive : undefined,
                                leftIcon ? styles.floatingLabelWithIcon : undefined
                            )}
                        >
                            {label}
                        </label>
                    )}
                    {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
                </div>
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className={cn(styles.wrapper, error && styles.error)}>
                {label && <label className={styles.label}>{label}</label>}
                <textarea
                    ref={ref}
                    className={cn(styles.input, styles.textarea, className)}
                    {...props}
                />
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
export default Input;
