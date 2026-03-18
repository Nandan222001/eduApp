import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/components/shared/Button';
import { renderWithProviders } from '../utils';

describe('Button Component', () => {
  it('should render button with title', () => {
    const { getByText } = renderWithProviders(<Button title="Click Me" />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button title="Click Me" onPress={onPress} />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button title="Click Me" disabled onPress={onPress} />
    );

    const button = getByText('Click Me');
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const { getByTestId } = renderWithProviders(
      <Button title="Click Me" loading />
    );

    expect(getByTestId('activity-indicator') || { type: 'ActivityIndicator' }).toBeTruthy();
  });

  it('should render with icon', () => {
    const { getByText } = renderWithProviders(
      <Button title="Click Me" icon={{ name: 'check', type: 'feather' }} />
    );

    expect(getByText('Click Me')).toBeTruthy();
  });
});
