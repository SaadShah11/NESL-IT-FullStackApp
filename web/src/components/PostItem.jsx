import React, { memo } from 'react'

const PostItem = memo(({ post, isAdmin, onDelete }) => {
  const handleDelete = async () => {
    // Delete functionality disabled
    return
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={styles.postItem}>
      <div style={styles.postHeader}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {post.author?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={styles.authorName}>
              {post.author || 'Unknown User'}
            </div>
            <div style={styles.timestamp}>
              {formatDate(post.timestamp)}
            </div>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={handleDelete}
            style={styles.deleteButton}
            title="Delete post"
          >
            ×
          </button>
        )}
      </div>
      
      <div style={styles.postContent}>
        {post.content}
      </div>
      
      {post.tags && post.tags.length > 0 && (
        <div style={styles.tags}>
          {post.tags.map((tag, index) => (
            <span key={index} style={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

const styles = {
  postItem: {
    backgroundColor: 'white',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    transition: 'box-shadow 0.2s ease',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginRight: '12px'
  },
  authorName: {
    fontWeight: '600',
    color: '#14171a',
    fontSize: '15px'
  },
  timestamp: {
    color: '#657786',
    fontSize: '13px',
    marginTop: '2px'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#657786',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  postContent: {
    color: '#14171a',
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '12px',
    whiteSpace: 'pre-wrap'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  tag: {
    color: '#007bff',
    fontSize: '13px',
    fontWeight: '500'
  }
}

PostItem.displayName = 'PostItem'

export default PostItem 