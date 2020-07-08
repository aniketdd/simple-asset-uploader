function confirmUpload(id, status, incompleteAssets, completeAssets) {
  if (status === 'uploaded' && incompleteAssets.has(id)) {
    incompleteAssets.delete(id);
    completeAssets.add(id);
    return {
      status: 200,
      message: 'Asset is completely uploaded'
    };
  } else if (completeAssets.has(id)) {
    return {
      status: 400,
      message: 'Asset is already uploaded'
    };
  } else if (!incompleteAssets.has(id)) {
    return {
      status: 400,
      message: 'Asset has not been created yet'
    };
  }
  return {
    status: 200,
    message: `Asset status is set as: ${status}`
  };
}

module.exports.confirmUpload = confirmUpload;
