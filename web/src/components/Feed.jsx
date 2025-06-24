import React, { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useInfiniteApi } from '../hooks/useApi'
import PostItem from './PostItem'

const Feed = () => {
  const { user, logout, apiCall } = useAuth()
  const observerRef = useRef()
  const lastPostElementRef = useRef()
  const currentUserRef = useRef(null)

  // Use infinite API hook to fetch posts
  const {
    data: posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    reset
  } = useInfiniteApi('/feed', {
    limit: 10,
    cacheTime: 1 * 60 * 1000, // 1 minute cache to prevent excessive requests
    skip: !user?.id // Don't fetch if no user
  })

  // Reset feed when user changes (only once per user change)
  useEffect(() => {
    if (user?.id && currentUserRef.current !== user.id) {
      console.log(`User changed from ${currentUserRef.current} to ${user.id}, resetting feed`)
      currentUserRef.current = user.id
      reset() // This will clear existing posts and refetch
    }
  }, [user?.id]) // Removed reset from dependencies to prevent infinite loop

  // Intersection Observer for infinite scroll
  const lastPostRef = useCallback(node => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, loadMore])

  // Handle post deletion (admin only)
  const handleDeletePost = async (postId) => {
    try {
      const response = await apiCall(`/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete post')
      }

      // Refresh the feed after successful deletion
      refetch()
    } catch (error) {
      throw error
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
  }



  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Social Feed</h1>
          <div style={styles.userSection}>
            <span style={styles.userInfo}>
              Welcome, {user?.username || user?.id} ({user?.role})
            </span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div style={styles.feedContainer}>
        <div style={styles.feed}>
          {error && (
                         <div style={styles.errorMessage}>
               <p>Error loading feed: {error}</p>
               <button onClick={() => window.location.reload()} style={styles.retryButton}>
                 Try Again
               </button>
             </div>
          )}

          {!error && posts.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <h3>No posts yet</h3>
              <p>Be the first to post something!</p>
            </div>
          )}

          {posts.length > 0 && (
            <div style={styles.postsList}>
              {posts.map((post, index) => {
                const isLast = index === posts.length - 1
                return (
                  <div
                    key={post._id || `post-${index}`}
                    ref={isLast ? lastPostRef : null}
                  >
                    <PostItem
                      post={post}
                      isAdmin={isAdmin}
                      onDelete={handleDeletePost}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Loading states */}
          {loading && posts.length === 0 && (
            <div style={styles.initialLoading}>
              <div style={styles.spinner}></div>
              <p>Loading your feed...</p>
            </div>
          )}

          {loading && posts.length > 0 && (
            <div style={styles.loadingMore}>
              <div style={styles.spinner}></div>
              <p>Loading more posts...</p>
            </div>
          )}

          {/* End of feed indicator */}
          {!hasMore && posts.length > 0 && (
            <div style={styles.endOfFeed}>
              <p>You've reached the end of your feed</p>
            </div>
          )}

          {/* Manual load more button (fallback) */}
          {hasMore && !loading && posts.length > 0 && (
            <div style={styles.loadMoreContainer}>
              <button onClick={loadMore} style={styles.loadMoreButton}>
                Load More Posts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e1e8ed',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    color: '#14171a',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  userInfo: {
    color: '#657786',
    fontSize: '14px'
  },

  logoutButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  feedContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
  },
  feed: {
    width: '100%'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #f5c6cb'
  },
  retryButton: {
    marginTop: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e1e8ed'
  },
  postsList: {
    width: '100%'
  },
  initialLoading: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  loadingMore: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginTop: '12px'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 10px'
  },
  endOfFeed: {
    textAlign: 'center',
    padding: '20px',
    color: '#657786',
    fontSize: '14px'
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: '20px'
  },
  loadMoreButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
}

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

export default Feed 