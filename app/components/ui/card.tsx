import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('container rounded-lg border bg-card text-card-foreground shadow-sm', className)}
		{...props}
	/>
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex flex-col  p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(({ className, children, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn('text-4xl font-extrabold leading-none tracking-tight text-card-foreground', className)}
		{...props}
	>
		{children}
	</h3>
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => (
	<p ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
