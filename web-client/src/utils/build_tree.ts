import { BubbleStructureDto, BubbleNode } from "../types";

export function buildTree(items: BubbleStructureDto[]): BubbleNode[] {
  const rootItems: BubbleNode[] = [];
  const lookup: Record<number, BubbleNode> = {};

  items.forEach((item) => {
    lookup[item.id] = {
      ...item,
      children: [],
      orderIndex: 0,
      status: 1,
    };
  });

  items.forEach((item) => {
    const node = lookup[item.id];
    if (!node) return;

    if (item.parentId) {
      const parent = lookup[item.parentId];
      if (parent) {
        parent.children.push(node);
      } else {
        rootItems.push(node);
      }
    } else {
      rootItems.push(node);
    }
  });

  return rootItems;
}
