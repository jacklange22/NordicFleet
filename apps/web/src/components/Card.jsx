// Surface container - direct port of the mobile Card atom. Same border
// + radius, dark surface. Pass `as` to render a different element
// (e.g. as="a" for a clickable link).

export function Card({as: Tag = 'div', className = '', children, ...rest}) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-2xl p-5 ${className}`}
      {...rest}>
      {children}
    </Tag>
  );
}
