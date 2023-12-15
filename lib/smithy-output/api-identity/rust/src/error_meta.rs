// Code generated by software.amazon.smithy.rust.codegen.smithy-rs. DO NOT EDIT.
/// All possible error types for this service.
#[non_exhaustive]
#[derive(std::fmt::Debug)]
pub enum Error {
	/// An error thrown when the requestee has sent an invalid or malformed request.
	BadRequestError(crate::error::BadRequestError),
	/// An error thrown when the requestee requests a resource they do not have access to.
	ForbiddenError(crate::error::ForbiddenError),
	/// An error caused by internal server problems.
	InternalError(crate::error::InternalError),
	/// An error thrown when the requestee requests a non existent resource.
	NotFoundError(crate::error::NotFoundError),
	/// An error thrown when the requestee has hit a rate limit. You are sending too many requests too quickly.
	RateLimitError(crate::error::RateLimitError),
	/// An error thrown when the requestee is not authenticated.
	UnauthorizedError(crate::error::UnauthorizedError),
	/// An unhandled error occurred.
	Unhandled(Box<dyn std::error::Error + Send + Sync + 'static>),
}
impl std::fmt::Display for Error {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match self {
			Error::BadRequestError(inner) => inner.fmt(f),
			Error::ForbiddenError(inner) => inner.fmt(f),
			Error::InternalError(inner) => inner.fmt(f),
			Error::NotFoundError(inner) => inner.fmt(f),
			Error::RateLimitError(inner) => inner.fmt(f),
			Error::UnauthorizedError(inner) => inner.fmt(f),
			Error::Unhandled(inner) => inner.fmt(f),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::CancelGameLinkError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::CancelGameLinkError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::CancelGameLinkErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::CancelGameLinkErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::CancelGameLinkErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::CancelGameLinkErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::CancelGameLinkErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::CancelGameLinkErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::CancelGameLinkErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::CompleteGameLinkError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::CompleteGameLinkError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::CompleteGameLinkErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::CompleteGameLinkErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::CompleteIdentityAvatarUploadError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::CompleteIdentityAvatarUploadError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::CompleteIdentityAvatarUploadErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::CompleteIdentityAvatarUploadErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::FollowIdentityError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::FollowIdentityError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::FollowIdentityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::FollowIdentityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::FollowIdentityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::FollowIdentityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::FollowIdentityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::FollowIdentityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::FollowIdentityErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::GetGameLinkError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::GetGameLinkError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::GetGameLinkErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::GetGameLinkErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::GetGameLinkErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::GetGameLinkErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::GetGameLinkErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::GetGameLinkErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::GetGameLinkErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::GetIdentityHandlesError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::GetIdentityHandlesError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::GetIdentityHandlesErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::GetIdentityHandlesErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::GetIdentityProfileError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::GetIdentityProfileError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::GetIdentityProfileErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::GetIdentityProfileErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::GetIdentitySelfProfileError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::GetIdentitySelfProfileError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::GetIdentitySelfProfileErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::GetIdentitySelfProfileErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::GetIdentitySummariesError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::GetIdentitySummariesError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::GetIdentitySummariesErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::GetIdentitySummariesErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListActivitiesError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::ListActivitiesError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListActivitiesErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListActivitiesErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListActivitiesErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListActivitiesErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListActivitiesErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListActivitiesErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListActivitiesErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListFollowersError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::ListFollowersError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListFollowersErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListFollowersErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListFollowersErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListFollowersErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListFollowersErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListFollowersErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListFollowersErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListFollowingError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::ListFollowingError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListFollowingErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListFollowingErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListFollowingErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListFollowingErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListFollowingErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListFollowingErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListFollowingErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListFriendsError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::ListFriendsError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListFriendsErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListFriendsErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListFriendsErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListFriendsErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListFriendsErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListFriendsErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListFriendsErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListMutualFriendsError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::ListMutualFriendsError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListMutualFriendsErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListMutualFriendsErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ListRecentFollowersError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::ListRecentFollowersError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ListRecentFollowersErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ListRecentFollowersErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::MarkDeletionError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::MarkDeletionError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::MarkDeletionErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::MarkDeletionErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::MarkDeletionErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::MarkDeletionErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::MarkDeletionErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::MarkDeletionErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::MarkDeletionErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::PrepareGameLinkError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::PrepareGameLinkError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::PrepareGameLinkErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::PrepareGameLinkErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::PrepareIdentityAvatarUploadError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::PrepareIdentityAvatarUploadError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::PrepareIdentityAvatarUploadErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::PrepareIdentityAvatarUploadErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::RecentFollowerIgnoreError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::RecentFollowerIgnoreError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::RecentFollowerIgnoreErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::RecentFollowerIgnoreErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::RemoveIdentityGameActivityError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::RemoveIdentityGameActivityError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::RemoveIdentityGameActivityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::RemoveIdentityGameActivityErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ReportIdentityError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::ReportIdentityError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ReportIdentityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ReportIdentityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ReportIdentityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ReportIdentityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ReportIdentityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ReportIdentityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ReportIdentityErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::SearchIdentitiesError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::SearchIdentitiesError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::SearchIdentitiesErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::SearchIdentitiesErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::SetIdentityGameActivityError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::SetIdentityGameActivityError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::SetIdentityGameActivityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::SetIdentityGameActivityErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::SetupIdentityError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::SetupIdentityError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::SetupIdentityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::SetupIdentityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::SetupIdentityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::SetupIdentityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::SetupIdentityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::SetupIdentityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::SetupIdentityErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::SignupForBetaError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::SignupForBetaError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::SignupForBetaErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::SignupForBetaErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::SignupForBetaErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::SignupForBetaErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::SignupForBetaErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::SignupForBetaErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::SignupForBetaErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::UnfollowIdentityError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::UnfollowIdentityError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::UnfollowIdentityErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::UnfollowIdentityErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::UnmarkDeletionError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::UnmarkDeletionError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::UnmarkDeletionErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::UnmarkDeletionErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::UpdateIdentityProfileError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::UpdateIdentityProfileError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::UpdateIdentityProfileErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::UpdateIdentityProfileErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::UpdateIdentityStatusError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::UpdateIdentityStatusError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::UpdateIdentityStatusErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::UpdateIdentityStatusErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::ValidateIdentityProfileError, R>>
	for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(
		err: aws_smithy_http::result::SdkError<crate::error::ValidateIdentityProfileError, R>,
	) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::ValidateIdentityProfileErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::ValidateIdentityProfileErrorKind::Unhandled(inner) => {
					Error::Unhandled(inner)
				}
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl<R> From<aws_smithy_http::result::SdkError<crate::error::WatchEventsError, R>> for Error
where
	R: Send + Sync + std::fmt::Debug + 'static,
{
	fn from(err: aws_smithy_http::result::SdkError<crate::error::WatchEventsError, R>) -> Self {
		match err {
			aws_smithy_http::result::SdkError::ServiceError { err, .. } => match err.kind {
				crate::error::WatchEventsErrorKind::InternalError(inner) => {
					Error::InternalError(inner)
				}
				crate::error::WatchEventsErrorKind::RateLimitError(inner) => {
					Error::RateLimitError(inner)
				}
				crate::error::WatchEventsErrorKind::ForbiddenError(inner) => {
					Error::ForbiddenError(inner)
				}
				crate::error::WatchEventsErrorKind::UnauthorizedError(inner) => {
					Error::UnauthorizedError(inner)
				}
				crate::error::WatchEventsErrorKind::NotFoundError(inner) => {
					Error::NotFoundError(inner)
				}
				crate::error::WatchEventsErrorKind::BadRequestError(inner) => {
					Error::BadRequestError(inner)
				}
				crate::error::WatchEventsErrorKind::Unhandled(inner) => Error::Unhandled(inner),
			},
			_ => Error::Unhandled(err.into()),
		}
	}
}
impl std::error::Error for Error {}
