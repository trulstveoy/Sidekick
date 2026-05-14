import type {
  ContextViewRow,
  ContextViewsSnapshot,
  FolderTag,
  FolderTreeNode,
  ProjectContext,
} from './sidekick-api';

const ROOT_PATH = '.';

const getChildren = (node: FolderTreeNode) => node.children ?? [];

const isFolderNode = (node: FolderTreeNode) => node.kind === 'folder';

const getProjectTag = (node: FolderTreeNode): FolderTag | undefined => {
  if (node.relativePath === ROOT_PATH || node.metadata?.status !== 'valid') {
    return undefined;
  }

  return node.metadata.tags.find(
    (tag) => tag.kind === 'system' && tag.systemEffect === 'project-root',
  );
};

const createFoldersRow = (node: FolderTreeNode): ContextViewRow => ({
  id: `folders:${node.relativePath}`,
  viewId: 'folders',
  artifactRelativePath: node.relativePath,
  artifactKind: node.kind,
  artifactType: node.artifactType,
  displayLabel: node.name,
  viewReason: 'physical-tree-node',
  sourceKind: 'physical-tree',
  size: node.size,
  modifiedAt: node.modifiedAt,
});

const createProjectRootRow = (
  node: FolderTreeNode,
  contextId: string,
  contextLabel: string,
): ContextViewRow => ({
  id: `projects:${contextId}:root`,
  viewId: 'projects',
  artifactRelativePath: node.relativePath,
  artifactKind: 'folder',
  displayLabel: contextLabel,
  displayGroup: 'Prosjekt',
  contextId,
  contextLabel,
  contextType: 'project',
  viewReason: 'project-root-tag',
  sourceKind: 'project-root',
  modifiedAt: node.modifiedAt,
});

const createProjectFileRow = (
  node: FolderTreeNode,
  contextId: string,
  contextLabel: string,
): ContextViewRow => ({
  id: `projects:${contextId}:${node.relativePath}`,
  viewId: 'projects',
  artifactRelativePath: node.relativePath,
  artifactKind: 'file',
  artifactType: node.artifactType,
  displayLabel: node.name,
  displayGroup: 'Prosjektfiler',
  contextId,
  contextLabel,
  contextType: 'project',
  viewReason: 'physical-project-file',
  sourceKind: 'physical-project-file',
  size: node.size,
  modifiedAt: node.modifiedAt,
});

const collectFoldersRows = (node: FolderTreeNode, rows: ContextViewRow[] = []) => {
  rows.push(createFoldersRow(node));
  getChildren(node).forEach((child) => collectFoldersRows(child, rows));

  return rows;
};

const collectProjectFileRows = (
  node: FolderTreeNode,
  contextId: string,
  contextLabel: string,
  rows: ContextViewRow[] = [],
) => {
  getChildren(node).forEach((child) => {
    if (isFolderNode(child)) {
      collectProjectFileRows(child, contextId, contextLabel, rows);
      return;
    }

    rows.push(createProjectFileRow(child, contextId, contextLabel));
  });

  return rows;
};

const collectProjectContexts = (
  node: FolderTreeNode,
  contexts: ProjectContext[] = [],
) => {
  const projectTag = getProjectTag(node);

  if (projectTag) {
    const contextId = projectTag.context?.id ?? node.metadata?.folderId ?? node.relativePath;
    const contextLabel = projectTag.context?.name ?? node.name;
    const rootRow = createProjectRootRow(node, contextId, contextLabel);
    const rows = collectProjectFileRows(node, contextId, contextLabel);

    contexts.push({
      id: contextId,
      type: 'project',
      label: contextLabel,
      rootRelativePath: node.relativePath,
      rootRow,
      rows,
    });
  }

  getChildren(node).forEach((child) => {
    if (isFolderNode(child)) {
      collectProjectContexts(child, contexts);
    }
  });

  return contexts;
};

export const deriveContextViews = (tree: FolderTreeNode): ContextViewsSnapshot => {
  const projectContexts = collectProjectContexts(tree);

  return {
    folders: {
      id: 'folders',
      label: 'Mapper',
      rows: collectFoldersRows(tree),
    },
    projects: {
      id: 'projects',
      label: 'Prosjekter',
      contexts: projectContexts,
      rows: projectContexts.flatMap((context) => [context.rootRow, ...context.rows]),
    },
  };
};
