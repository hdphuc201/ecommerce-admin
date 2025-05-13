export const useRenderCate = (categories, parentId = null, level = 0) => {
    return categories
        .filter((cat) => String(cat.parent) === String(parentId)) // so sánh parentId
        .map((cat) => [
            <option key={cat._id} value={cat._id}>
                {`${'⎯⎯'.repeat(level)} ${cat.title}`}
            </option>,
            ...useRenderCate(categories, cat._id, level + 1), // đệ quy cho con
        ]);
};
