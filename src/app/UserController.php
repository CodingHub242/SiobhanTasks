<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\TUser;

class UserController extends Controller
{
    /**
     * Update user profile information
     */
    public function updateProfile(Request $request)
    {
        $user = TUser::findOrFail($request->user()->id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $user,
                'name' => $user->name,
                'phone' => $user->phone,
            ]
        ]);
    }

    /**
     * Upload/Update user avatar
     */
    public function uploadAvatar(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'avatar' => 'required|string', // Base64 encoded image
        ]);
        
        $avatarData = $request->avatar;
        
        // Check if it's a valid base64 image
        if (!preg_match('/^data:image\/(jpeg|png|jpg|gif|webp);base64,/', $avatarData)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.'
            ], 422);
        }
        
        // Extract base64 data
        $imageData = explode(',', $avatarData)[1];
        $imageData = base64_decode($imageData);
        
        if ($imageData === false) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid base64 data'
            ], 422);
        }
        
        // Check file size (max 2MB)
        $fileSize = strlen($imageData);
        if ($fileSize > 2 * 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'Image size must be less than 2MB'
            ], 422);
        }
        
        // Validate image dimensions
        $imageInfo = getimagesizefromstring($imageData);
        if ($imageInfo === false) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid image data'
            ], 422);
        }
        
        // Generate unique filename
        $extension = 'jpg';
        switch ($imageInfo['mime']) {
            case 'image/jpeg':
                $extension = 'jpg';
                break;
            case 'image/png':
                $extension = 'png';
                break;
            case 'image/gif':
                $extension = 'gif';
                break;
            case 'image/webp':
                $extension = 'webp';
                break;
        }
        
        $filename = 'avatars/' . $user->id . '_' . time() . '.' . $extension;
        
        // Save directly to public/storage/avatars
        $storagePath = public_path('storage/' . $filename);
        $directory = dirname($storagePath);
        
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }
        
        file_put_contents($storagePath, $imageData);
        
        // Delete old avatar if exists
        if ($user->avatar && file_exists(public_path('storage/' . $user->avatar))) {
            unlink(public_path('storage/' . $user->avatar));
        }
        
        // Update user avatar
        $user->avatar = $filename;
        $user->save();
        
        // Generate full URL
        $avatarUrl = asset('storage/' . $filename);
        
        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully',
            'data' => [
                'avatar' => $avatarUrl,
                'avatar_path' => $filename
            ]
        ]);
    }

    /**
     * Remove user avatar
     */
    public function removeAvatar(Request $request)
    {
        $user = Auth::user();
        
        // Delete old avatar if exists
        if ($user->avatar && file_exists(public_path('storage/' . $user->avatar))) {
            unlink(public_path('storage/' . $user->avatar));
        }
        
        // Set avatar to null
        $user->avatar = null;
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Avatar removed successfully'
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);
        
        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }
        
        // Update password
        $user->password = Hash::make($validated['password']);
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Get user profile
     */
    public function profile()
    {
        $user = Auth::user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Update user (admin only - for other users)
     */
    public function update(Request $request, $id)
    {
        $user = TUser::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:tusers,email,' . $id,
            'phone' => 'sometimes|nullable|string|max:20',
            'role' => 'sometimes|string|in:admin,employee',
            'department' => 'sometimes|nullable|string|max:100',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Delete user (admin only)
     */
    public function destroy($id)
    {
        $user = TUser::findOrFail($id);
        
        // Delete avatar if exists
        if ($user->avatar && file_exists(public_path('storage/' . $user->avatar))) {
            unlink(public_path('storage/' . $user->avatar));
        }
        
        $user->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
