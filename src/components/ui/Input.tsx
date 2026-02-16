'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './input.module.css';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    large?: boolean;
    wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, large, className, wrapperClassName, ...props }, ref) => {
        return (
            <div className={cn(styles.wrapper, error && styles.error, wrapperClassName)}>
                {label && <label className={styles.label}>{label}</label>}
                <div className={styles.inputContainer}>
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        className={cn(
                            styles.input,
                            large && styles.inputLarge,
                            leftIcon && styles.hasLeftIcon,
                            rightIcon && styles.hasRightIcon,
                            className
                        )}
                        {...props}
                    />
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
